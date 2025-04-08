from flask import request, jsonify
from datetime import datetime

from .. import db
from ..models import User
from . import api_blueprint
from .auth import token_required


@api_blueprint.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    # 管理员功能，普通项目可以去掉或增加管理员权限检查
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@api_blueprint.route('/api/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    # 只允许查看自己的资料，或者是管理员权限
    if current_user.id != user_id:
        return jsonify({'message': '无权限访问'}), 403
        
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@api_blueprint.route('/api/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    # 只允许更新自己的资料
    if current_user.id != user_id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 更新基本信息
    if 'name' in data:
        current_user.name = data['name']
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': '邮箱已被使用'}), 409
        current_user.email = data['email']
    if 'height' in data:
        current_user.height = data['height']
    if 'current_weight' in data:
        current_user.current_weight = data['current_weight']
    if 'initial_weight' in data:
        current_user.initial_weight = data['initial_weight']
    if 'weight_goal' in data:
        current_user.weight_goal = data['weight_goal']
    if 'gender' in data:
        current_user.gender = data['gender']
    if 'birthday' in data and data['birthday']:
        try:
            current_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
        except:
            pass
    if 'profile_image' in data:
        current_user.profile_image = data['profile_image']
    
    # 如果提供了当前体重，可以更新BMI
    if 'current_weight' in data and current_user.height:
        height_m = current_user.height / 100  # 转换为米
        current_user.bmi = current_user.current_weight / (height_m * height_m)
    
    db.session.commit()
    return jsonify({
        'message': '用户信息更新成功',
        'user': current_user.to_dict()
    })

@api_blueprint.route('/api/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    # 只允许删除自己的账户或管理员权限
    if current_user.id != user_id:
        return jsonify({'message': '无权限访问'}), 403
    
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '用户删除成功'}), 200

@api_blueprint.route('/api/users/<int:user_id>/change_password', methods=['PUT'])
@token_required
def change_password(current_user, user_id):
    # 只允许更改自己的密码
    if current_user.id != user_id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    if not data or 'old_password' not in data or 'new_password' not in data:
        return jsonify({'message': '请提供旧密码和新密码'}), 400
    
    from werkzeug.security import check_password_hash, generate_password_hash
    if not check_password_hash(current_user.password_hash, data['old_password']):
        return jsonify({'message': '旧密码错误'}), 401
    
    current_user.password_hash = generate_password_hash(data['new_password'])
    # 更改密码时通常会使令牌失效，要求用户重新登录
    current_user.auth_token = None
    db.session.commit()
    
    return jsonify({'message': '密码修改成功，请重新登录'}), 200


@api_blueprint.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    print(data)


    # 验证必要字段
    required_fields = ['username', 'password', 'name', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'缺少必要字段: {field}'}), 400
    
    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已被使用'}), 409
    
    # 创建新用户
    from werkzeug.security import generate_password_hash
    
    new_user = User(
        username=data['username'],
        password_hash=generate_password_hash(data['password']),
        name=data['name'],
        email=data['email'],
        height=data.get('height'),
        current_weight=data.get('current_weight'),
        initial_weight=data.get('initial_weight', data.get('current_weight')),  # 如果没提供，使用当前体重
        weight_goal=data.get('weight_goal'),
        gender=data.get('gender'),
        profile_image=data.get('profile_image'),
        created_at=datetime.utcnow()
    )
    
    # 处理生日字段
    if 'birthday' in data and data['birthday']:
        try:
            new_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
        except:
            pass
    
    # 如果提供了身高和体重，计算BMI
    if new_user.height and new_user.current_weight:
        height_m = new_user.height / 100  # 转换为米
        new_user.bmi = new_user.current_weight / (height_m * height_m)
    
    db.session.add(new_user)
    db.session.commit()
    
    # 创建用户统计记录
    from ..models import UserStat
    user_stat = UserStat(user_id=new_user.id)
    db.session.add(user_stat)
    db.session.commit()
    
    return jsonify({
        'message': '用户注册成功',
        'user': new_user.to_dict()
    }), 201