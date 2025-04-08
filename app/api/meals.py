from flask import request, jsonify
from datetime import datetime, date

from .. import db
from ..models import Meal, Food
from . import api_blueprint
from .auth import token_required

@api_blueprint.route('/api/meals', methods=['GET'])
@token_required
def get_meals(current_user):
    # 可以通过日期等参数过滤
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    meal_type = request.args.get('type')
    
    query = Meal.query.filter_by(user_id=current_user.id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Meal.date >= start)
        except:
            pass
            
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Meal.date <= end)
        except:
            pass
    
    if meal_type:
        query = query.filter_by(type=meal_type)
        
    meals = query.order_by(Meal.date.desc(), Meal.time).all()
    return jsonify([meal.to_dict() for meal in meals])

@api_blueprint.route('/api/meals/<int:meal_id>', methods=['GET'])
@token_required
def get_meal(current_user, meal_id):
    meal = Meal.query.get_or_404(meal_id)
    
    # 检查是否是当前用户的餐食记录
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
        
    return jsonify(meal.to_dict())

@api_blueprint.route('/api/meals', methods=['POST'])
@token_required
def create_meal(current_user):
    data = request.json
    
    # 验证必要字段
    if 'type' not in data:
        return jsonify({'message': '缺少必要字段: type'}), 400
    
    # 处理日期，如果未提供则使用今天
    meal_date = date.today()
    if 'date' in data and data['date']:
        try:
            meal_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            return jsonify({'message': '日期格式不正确，应为YYYY-MM-DD'}), 400
    
    new_meal = Meal(
        user_id=current_user.id,
        date=meal_date,
        type=data['type'],
        time=data.get('time'),
        total_calories=data.get('total_calories', 0),
        completed=data.get('completed', False)
    )
    
    db.session.add(new_meal)
    db.session.commit()
    
    # 处理食物列表
    foods_data = data.get('foods', [])
    total_calories = 0
    
    for food_data in foods_data:
        if 'name' not in food_data:
            continue
            
        food = Food(
            meal_id=new_meal.id,
            name=food_data['name'],
            amount=food_data.get('amount'),
            calories=food_data.get('calories'),
            protein=food_data.get('protein'),
            carbs=food_data.get('carbs'),
            fat=food_data.get('fat')
        )
        
        db.session.add(food)
        
        if food.calories:
            total_calories += food.calories
    
    # 更新总卡路里
    if total_calories > 0:
        new_meal.total_calories = total_calories
        
    db.session.commit()
    
    return jsonify({
        'message': '餐食记录创建成功',
        'meal': new_meal.to_dict()
    }), 201

@api_blueprint.route('/api/meals/<int:meal_id>', methods=['PUT'])
@token_required
def update_meal(current_user, meal_id):
    meal = Meal.query.get_or_404(meal_id)
    
    # 检查权限
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 更新基本信息
    if 'type' in data:
        meal.type = data['type']
    if 'time' in data:
        meal.time = data['time']
    if 'completed' in data:
        meal.completed = data['completed']
    if 'date' in data:
        try:
            meal.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            pass
    
    # 手动更新总卡路里
    if 'total_calories' in data:
        meal.total_calories = data['total_calories']
        
    db.session.commit()
    
    return jsonify({
        'message': '餐食记录更新成功',
        'meal': meal.to_dict()
    })

@api_blueprint.route('/api/meals/<int:meal_id>', methods=['DELETE'])
@token_required
def delete_meal(current_user, meal_id):
    meal = Meal.query.get_or_404(meal_id)
    
    # 检查权限
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    db.session.delete(meal)
    db.session.commit()
    
    return jsonify({'message': '餐食记录删除成功'})

@api_blueprint.route('/api/meals/<int:meal_id>/foods', methods=['POST'])
@token_required
def add_food_to_meal(current_user, meal_id):
    meal = Meal.query.get_or_404(meal_id)
    
    # 检查权限
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 验证必要字段
    if 'name' not in data:
        return jsonify({'message': '缺少必要字段: name'}), 400
    
    new_food = Food(
        meal_id=meal.id,
        name=data['name'],
        amount=data.get('amount'),
        calories=data.get('calories'),
        protein=data.get('protein'),
        carbs=data.get('carbs'),
        fat=data.get('fat')
    )
    
    db.session.add(new_food)
    
    # 更新餐食总卡路里
    if new_food.calories:
        meal.total_calories = meal.total_calories + new_food.calories
    
    db.session.commit()
    
    return jsonify({
        'message': '食物添加成功',
        'food': new_food.to_dict()
    }), 201

@api_blueprint.route('/api/foods/<int:food_id>', methods=['PUT'])
@token_required
def update_food(current_user, food_id):
    food = Food.query.get_or_404(food_id)
    meal = Meal.query.get(food.meal_id)
    
    # 检查权限
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 保存旧卡路里值用于更新总卡路里
    old_calories = food.calories or 0
    
    # 更新食物信息
    if 'name' in data:
        food.name = data['name']
    if 'amount' in data:
        food.amount = data['amount']
    if 'calories' in data:
        food.calories = data['calories']
    if 'protein' in data:
        food.protein = data['protein']
    if 'carbs' in data:
        food.carbs = data['carbs']
    if 'fat' in data:
        food.fat = data['fat']
    
    # 更新餐食总卡路里
    if 'calories' in data:
        meal.total_calories = meal.total_calories - old_calories + food.calories
    
    db.session.commit()
    
    return jsonify({
        'message': '食物信息更新成功',
        'food': food.to_dict()
    })

@api_blueprint.route('/api/foods/<int:food_id>', methods=['DELETE'])
@token_required
def delete_food(current_user, food_id):
    food = Food.query.get_or_404(food_id)
    meal = Meal.query.get(food.meal_id)
    
    # 检查权限
    if meal.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    # 更新餐食总卡路里
    if food.calories:
        meal.total_calories = max(0, meal.total_calories - food.calories)
    
    db.session.delete(food)
    db.session.commit()
    
    return jsonify({'message': '食物删除成功'})