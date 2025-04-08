from flask import request, jsonify
from datetime import datetime

from .. import db
from ..models import Achievement
from . import api_blueprint
from .auth import token_required

@api_blueprint.route('/api/achievements', methods=['GET'])
@token_required
def get_achievements(current_user):
    # 查询所有当前用户的成就
    achievements = Achievement.query.filter_by(user_id=current_user.id).all()
    return jsonify([achievement.to_dict() for achievement in achievements])

@api_blueprint.route('/api/achievements/<int:achievement_id>', methods=['GET'])
@token_required
def get_achievement(current_user, achievement_id):
    achievement = Achievement.query.get_or_404(achievement_id)
    
    # 检查是否是当前用户的成就
    if achievement.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
        
    return jsonify(achievement.to_dict())

@api_blueprint.route('/api/achievements', methods=['POST'])
@token_required
def create_achievement(current_user):
    data = request.json
    
    # 验证必要字段
    if 'title' not in data:
        return jsonify({'message': '缺少必要字段: title'}), 400
    
    # 检查是否已存在相同标题的成就
    existing = Achievement.query.filter_by(user_id=current_user.id, title=data['title']).first()
    if existing:
        return jsonify({'message': '已存在相同标题的成就记录'}), 409
    
    new_achievement = Achievement(
        user_id=current_user.id,
        title=data['title'],
        description=data.get('description'),
        icon=data.get('icon'),
        color=data.get('color'),
        completed=data.get('completed', False)
    )
    
    # 如果成就已完成，设置完成时间
    if new_achievement.completed:
        new_achievement.date_earned = datetime.utcnow()
    
    db.session.add(new_achievement)
    db.session.commit()
    
    return jsonify({
        'message': '成就记录创建成功',
        'achievement': new_achievement.to_dict()
    }), 201

@api_blueprint.route('/api/achievements/<int:achievement_id>', methods=['PUT'])
@token_required
def update_achievement(current_user, achievement_id):
    achievement = Achievement.query.get_or_404(achievement_id)
    
    # 检查权限
    if achievement.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 更新成就信息
    if 'title' in data:
        achievement.title = data['title']
    if 'description' in data:
        achievement.description = data['description']
    if 'icon' in data:
        achievement.icon = data['icon']
    if 'color' in data:
        achievement.color = data['color']
    if 'completed' in data:
        # 更新完成状态和完成时间
        was_completed = achievement.completed
        achievement.completed = data['completed']
        
        # 如果从未完成变为完成，设置完成时间
        if not was_completed and achievement.completed and not achievement.date_earned:
            achievement.date_earned = datetime.utcnow()
        # 如果从完成变为未完成，清除完成时间    
        elif was_completed and not achievement.completed:
            achievement.date_earned = None
    
    db.session.commit()
    
    return jsonify({
        'message': '成就记录更新成功',
        'achievement': achievement.to_dict()
    })

@api_blueprint.route('/api/achievements/<int:achievement_id>', methods=['DELETE'])
@token_required
def delete_achievement(current_user, achievement_id):
    achievement = Achievement.query.get_or_404(achievement_id)
    
    # 检查权限
    if achievement.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    db.session.delete(achievement)
    db.session.commit()
    
    return jsonify({'message': '成就记录删除成功'})

@api_blueprint.route('/api/achievements/completed', methods=['GET'])
@token_required
def get_completed_achievements(current_user):
    # 查询已完成的成就
    achievements = Achievement.query.filter_by(
        user_id=current_user.id, 
        completed=True
    ).order_by(Achievement.date_earned.desc()).all()
    
    return jsonify([achievement.to_dict() for achievement in achievements])