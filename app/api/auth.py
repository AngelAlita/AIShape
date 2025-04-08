from flask import request, jsonify
from datetime import datetime
import secrets
from functools import wraps

from .. import db
from ..models import User
from . import api_blueprint

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # 获取token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': '缺少授权令牌'}), 401

        # 验证令牌
        user = User.query.filter_by(auth_token=token).first()
        if not user:
            return jsonify({'message': '无效的授权令牌'}), 401
        
        # 传递当前用户到被装饰的函数
        return f(user, *args, **kwargs)
    
    return decorated

@api_blueprint.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    print(data)
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'message': '请提供用户名和密码'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    if not user:
        return jsonify({'message': '用户不存在'}), 404
    
    from werkzeug.security import check_password_hash
    if not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': '密码错误'}), 401
    
    # 生成令牌
    auth_token = secrets.token_hex(32)
    user.auth_token = auth_token
    db.session.commit()
    
    return jsonify({
        'message': '登录成功',
        'token': auth_token,
        'user': user.to_dict()
    }), 200

@api_blueprint.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    current_user.auth_token = None
    db.session.commit()
    return jsonify({'message': '登出成功'}), 200

@api_blueprint.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify(current_user.to_dict()), 200