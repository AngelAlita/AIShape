from flask import Blueprint, jsonify, request
from .api import api_blueprint
from .models import User
from . import db
import requests
import re
import json
import base64
import io
from pyzbar.pyzbar import decode
from PIL import Image
import requests
from bs4 import BeautifulSoup
import openfoodfacts

# User-Agent is mandatory
api = openfoodfacts.API(user_agent="MyAwesomeApp/1.0")

@api_blueprint.route("/", methods=["GET"])
def test():
    return "Flask 外网访问成功！"

@api_blueprint.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@api_blueprint.route("/api/users", methods=["POST"])
def create_user():
    data = request.json
    new_user = User(name=data["name"], email=data["email"])
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@api_blueprint.route("/api/diet_recognition", methods=["POST"])
def recognize_diet():
    data = request.json
    prompt = (
        "请你识别图片中的主要食物，并根据其在图像中的大致占比，估算其重量（单位：克），并计算对应的营养成分。"
        "你需要返回以下字段（必须以 JSON 格式输出）："
        "食物名称：例如 \"玉米\""
        "重量：估算值，单位为克（g）"
        "卡路里：单位为 kcal"
        "蛋白质：单位为克（g）"
        "脂肪：单位为克（g）"
        "碳水化合物：单位为克（g）"
        "注意：只需输出 JSON，不要附加解释或说明文字。"
    )
    url = "https://api.siliconflow.cn/v1/chat/completions"

    payload = {
        "model": "Qwen/Qwen2.5-VL-72B-Instruct",
        "messages": [
            # {"role": "system", "content": "你的结果返回符合json格式,只需要返回json格式的结果"},
            {

                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{data['image']}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "stream": False,
        "max_tokens": 512,
        "stop": None,
        "temperature": 0.7,
        "top_p": 0.7,
        "top_k": 50,
        "frequency_penalty": 0.5,
        "n": 1,
    }
    headers = {
        "Authorization": "Bearer sk-woiuwpqaverbjnfendzbelzmyxsqngrbmxupklaudxegzadn",
        "Content-Type": "application/json"
    }

  
    response = requests.request("POST", url, json=payload, headers=headers)
    print(response)
    result = response.json()

    # 提取 content 字段
    content_str = result['choices'][0]['message']['content']
    print(content_str)
    # 去除 Markdown 格式，如 ```json ``` 包裹
    clean_json_str = re.sub(r"```(?:json)?|```", "", content_str).strip()

    # 转成 Python 字典
    content_json = json.loads(clean_json_str)

    
    return jsonify(content_json), 200


@api_blueprint.route("/api/barcode_nutrition", methods=["POST"])
def scan_barcode_nutrition():
    try:
        # 检查请求中是否包含图片
        if 'image' not in request.json:
            return jsonify({"error": "缺少图片数据"}), 400
    

        # 解码Base64图片
        image_data = base64.b64decode(request.json['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # 扫描条形码
        barcode_results = decode(image)
        
        if not barcode_results:
            return jsonify({"error": "未能在图片中检测到条形码"}), 404
        
        # 获取条形码值
        barcode = barcode_results[0].data.decode('utf-8')
        
        # 在中国食品网搜索条形码
        search_url = f"https://www.foodmate.net/s/?q={barcode}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        search_response = requests.get(search_url, headers=headers)
        search_soup = BeautifulSoup(search_response.text, 'html.parser')
        
        # 查找搜索结果中的第一个食品链接
        product_link = search_soup.select_one('h3.search-list-title a')
        
        if not product_link:
            return jsonify({
                "barcode": barcode,
                "error": "未能在中国食品网找到对应条形码的食品信息"
            }), 404
            
        # 获取详情页面
        product_url = product_link['href']
        product_response = requests.get(product_url, headers=headers)
        product_soup = BeautifulSoup(product_response.text, 'html.parser')
        
        # 提取食品基本信息
        product_name = product_soup.select_one('h1.detail-title').text.strip()
        
        # 尝试提取营养信息表格
        nutrition_table = product_soup.select_one('table.table')
        nutrition_data = {}
        
        if nutrition_table:
            rows = nutrition_table.select('tr')
            for row in rows:
                cells = row.select('td, th')
                if len(cells) >= 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    nutrition_data[key] = value
        
        # 提取卡路里信息
        calories = None
        for key, value in nutrition_data.items():
            if '热量' in key or '能量' in key or '卡路里' in key:
                calories = value
                break
                
        result = {
            "barcode": barcode,
            "product_name": product_name,
            "calories": calories,
            "nutrition_data": nutrition_data,
            "source_url": product_url
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": f"处理过程中出错: {str(e)}"}), 500
    
@api_blueprint.route("/api/food_recognition", methods=["POST"])
def food_recognition():
    try:
        # 检查请求中是否包含图片
        if 'image' not in request.json:
            return jsonify({"error": "缺少图片数据"}), 400
        
        user_id = request.json.get('user_id')
        image_data = base64.b64decode(request.json['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # 尝试扫描条形码
        barcode_results = decode(image)
        
        # 如果识别到条形码，使用条形码接口
        if barcode_results:
            # 获取条形码值
            barcode = barcode_results[0].data.decode('utf-8')
            
            # 在Open Food Facts 搜索条形码
            results = api.product.get(barcode)
            
            if not results:
                return jsonify({
                    "barcode": barcode,
                    "error": "未能在预包装食品营养标签数据查询系统找到对应条形码的食品信息",
                    "recognition_method": "barcode"
                }), 404
                
            nutrition_data = results.json()
    
            
                    
            result = {
                "食物名称": nutrition_data['name'],
                "重量": nutrition_data['quantity'],
                "卡路里": nutrition_data['calories'],
                "蛋白质": nutrition_data['proteins'],
                "脂肪": nutrition_data['fat'],
                "碳水化合物": nutrition_data['carbohydrates'],
                "recognition_method": "barcode"
            }
            
            return jsonify(result), 200
        
        # 如果未识别到条形码，使用大模型接口
        else:
            prompt = (
                "请你识别图片中的主要食物，并根据其在图像中的大致占比，估算其重量（单位：克），并计算对应的营养成分。"
                "你需要返回以下字段（必须以 JSON 格式输出）："
                "食物名称：例如 \"玉米\""
                "重量：估算值，单位为克（g）"
                "卡路里：单位为 kcal"
                "蛋白质：单位为克（g）"
                "脂肪：单位为克（g）"
                "碳水化合物：单位为克（g）"
                "注意：只需输出 JSON，不要附加解释或说明文字。"
            )
            url = "https://api.siliconflow.cn/v1/chat/completions"

            payload = {
                "model": "Qwen/Qwen2.5-VL-72B-Instruct",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{request.json['image']}"
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "stream": False,
                "max_tokens": 512,
                "stop": None,
                "temperature": 0.7,
                "top_p": 0.7,
                "top_k": 50,
                "frequency_penalty": 0.5,
                "n": 1,
            }
            headers = {
                "Authorization": "Bearer sk-woiuwpqaverbjnfendzbelzmyxsqngrbmxupklaudxegzadn",
                "Content-Type": "application/json"
            }

            response = requests.request("POST", url, json=payload, headers=headers)
            result = response.json()

            # 提取 content 字段
            content_str = result['choices'][0]['message']['content']
            # 去除 Markdown 格式，如 ```json ``` 包裹
            clean_json_str = re.sub(r"```(?:json)?|```", "", content_str).strip()

            # 转成 Python 字典
            content_json = json.loads(clean_json_str)
            
            # 添加识别方法标识
            content_json["recognition_method"] = "ai_model"
            
            return jsonify(content_json), 200
            
    except Exception as e:
        return jsonify({"error": f"处理过程中出错: {str(e)}"}), 500