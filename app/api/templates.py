from flask import request, jsonify
from datetime import datetime

from .. import db
from ..models import WorkoutTemplate, Workout, Exercise
from . import api_blueprint
from .auth import token_required

@api_blueprint.route('/api/workout_templates', methods=['GET'])
@token_required
def get_workout_templates(current_user):
    # 获取所有锻炼模板
    difficulty = request.args.get('difficulty')
    target_area = request.args.get('target_area')
    
    query = WorkoutTemplate.query
    
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if target_area:
        query = query.filter_by(target_area=target_area)
    
    templates = query.all()
    return jsonify([template.to_dict() for template in templates])

@api_blueprint.route('/api/workout_templates/<int:template_id>', methods=['GET'])
@token_required
def get_workout_template(current_user, template_id):
    template = WorkoutTemplate.query.get_or_404(template_id)
    return jsonify(template.to_dict())

@api_blueprint.route('/api/workout_templates', methods=['POST'])
@token_required
def create_workout_template(current_user):
    # 通常只有管理员才能创建模板，这里为了简化省略权限检查
    data = request.json
    
    # 验证必要字段
    if 'name' not in data:
        return jsonify({'message': '缺少必要字段: name'}), 400
    
    new_template = WorkoutTemplate(
        name=data['name'],
        description=data.get('description'),
        difficulty=data.get('difficulty'),
        estimated_duration=data.get('estimated_duration'),
        target_area=data.get('target_area')
    )
    
    db.session.add(new_template)
    db.session.commit()
    
    return jsonify({
        'message': '锻炼模板创建成功',
        'template': new_template.to_dict()
    }), 201

@api_blueprint.route('/api/workout_templates/<int:template_id>', methods=['PUT'])
@token_required
def update_workout_template(current_user, template_id):
    # 通常只有管理员才能更新模板，这里为了简化省略权限检查
    template = WorkoutTemplate.query.get_or_404(template_id)
    data = request.json
    
    # 更新模板信息
    if 'name' in data:
        template.name = data['name']
    if 'description' in data:
        template.description = data['description']
    if 'difficulty' in data:
        template.difficulty = data['difficulty']
    if 'estimated_duration' in data:
        template.estimated_duration = data['estimated_duration']
    if 'target_area' in data:
        template.target_area = data['target_area']
    
    db.session.commit()
    
    return jsonify({
        'message': '锻炼模板更新成功',
        'template': template.to_dict()
    })

@api_blueprint.route('/api/workout_templates/<int:template_id>', methods=['DELETE'])
@token_required
def delete_workout_template(current_user, template_id):
    # 通常只有管理员才能删除模板，这里为了简化省略权限检查
    template = WorkoutTemplate.query.get_or_404(template_id)
    
    db.session.delete(template)
    db.session.commit()
    
    return jsonify({'message': '锻炼模板删除成功'})

@api_blueprint.route('/api/workout_templates/<int:template_id>/create_workout', methods=['POST'])
@token_required
def create_workout_from_template(current_user, template_id):
    """基于模板创建一个新的锻炼记录"""
    template = WorkoutTemplate.query.get_or_404(template_id)
    data = request.json
    
    # 处理日期，如果未提供则使用今天
    from datetime import date
    workout_date = date.today()
    if 'date' in data and data['date']:
        try:
            workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            return jsonify({'message': '日期格式不正确，应为YYYY-MM-DD'}), 400
    
    # 创建新的锻炼记录
    new_workout = Workout(
        user_id=current_user.id,
        name=template.name,
        date=workout_date,
        time=data.get('time'),
        duration=template.estimated_duration,
        calories_burned=data.get('calories_burned'),
        completed=False
    )
    
    db.session.add(new_workout)
    db.session.commit()
    
    # 这里可以添加根据模板预设的运动项目
    # 实际应用中，应该还有一个模板运动项目的表
    # 这里简化处理，仅作为示例
    if 'exercises' in data:
        for exercise_data in data['exercises']:
            if 'name' not in exercise_data:
                continue
                
            exercise = Exercise(
                workout_id=new_workout.id,
                name=exercise_data['name'],
                sets=exercise_data.get('sets'),
                reps=exercise_data.get('reps'),
                weight=exercise_data.get('weight'),
                completed=False
            )
            
            db.session.add(exercise)
    
    db.session.commit()
    
    return jsonify({
        'message': '已从模板创建锻炼记录',
        'workout': new_workout.to_dict()
    }), 201