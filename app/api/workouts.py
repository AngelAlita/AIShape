from flask import request, jsonify
from datetime import datetime, date

from .. import db
from ..models import Workout, Exercise, UserStat
from . import api_blueprint
from .auth import token_required

@api_blueprint.route('/api/workouts', methods=['GET'])
@token_required
def get_workouts(current_user):
    # 可以通过日期等参数过滤
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    completed = request.args.get('completed')
    
    query = Workout.query.filter_by(user_id=current_user.id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Workout.date >= start)
        except:
            pass
            
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Workout.date <= end)
        except:
            pass
    
    if completed is not None:
        completed_bool = completed.lower() == 'true'
        query = query.filter_by(completed=completed_bool)
        
    workouts = query.order_by(Workout.date.desc()).all()
    return jsonify([workout.to_dict() for workout in workouts])

@api_blueprint.route('/api/workouts/<int:workout_id>', methods=['GET'])
@token_required
def get_workout(current_user, workout_id):
    workout = Workout.query.get_or_404(workout_id)
    
    # 检查是否是当前用户的锻炼记录
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
        
    return jsonify(workout.to_dict())

@api_blueprint.route('/api/workouts', methods=['POST'])
@token_required
def create_workout(current_user):
    data = request.json
    
    # 验证必要字段
    if 'name' not in data:
        return jsonify({'message': '缺少必要字段: name'}), 400
    
    # 处理日期，如果未提供则使用今天
    workout_date = date.today()
    if 'date' in data and data['date']:
        try:
            workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            return jsonify({'message': '日期格式不正确，应为YYYY-MM-DD'}), 400
    
    new_workout = Workout(
        user_id=current_user.id,
        name=data['name'],
        date=workout_date,
        time=data.get('time'),
        duration=data.get('duration'),
        calories_burned=data.get('calories_burned'),
        completed=data.get('completed', False)
    )
    
    db.session.add(new_workout)
    db.session.commit()
    
    # 处理运动列表
    exercises_data = data.get('exercises', [])
    
    for exercise_data in exercises_data:
        if 'name' not in exercise_data:
            continue
            
        exercise = Exercise(
            workout_id=new_workout.id,
            name=exercise_data['name'],
            sets=exercise_data.get('sets'),
            reps=exercise_data.get('reps'),
            weight=exercise_data.get('weight'),
            completed=exercise_data.get('completed', False)
        )
        
        db.session.add(exercise)
    
    db.session.commit()
    
    # 如果锻炼已完成，更新用户统计信息
    if new_workout.completed:
        update_user_stats_for_workout(current_user.id, add=True, workout=new_workout)
    
    return jsonify({
        'message': '锻炼记录创建成功',
        'workout': new_workout.to_dict()
    }), 201

@api_blueprint.route('/api/workouts/<int:workout_id>', methods=['PUT'])
@token_required
def update_workout(current_user, workout_id):
    workout = Workout.query.get_or_404(workout_id)
    
    # 检查权限
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 保存原始状态用于后续统计更新
    original_completed = workout.completed
    original_duration = workout.duration
    original_calories = workout.calories_burned
    
    # 更新基本信息
    if 'name' in data:
        workout.name = data['name']
    if 'time' in data:
        workout.time = data['time']
    if 'duration' in data:
        workout.duration = data['duration']
    if 'calories_burned' in data:
        workout.calories_burned = data['calories_burned']
    if 'date' in data:
        try:
            workout.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            pass
    if 'completed' in data:
        workout.completed = data['completed']
        
    db.session.commit()
    
    # 更新用户统计信息
    if original_completed != workout.completed:
        if workout.completed:  # 从未完成变为完成
            update_user_stats_for_workout(current_user.id, add=True, workout=workout)
        else:  # 从完成变为未完成
            update_user_stats_for_workout(current_user.id, add=False, 
                                         duration=original_duration, 
                                         calories=original_calories)
            
    # 已完成状态下的数据变更也需要更新统计
    elif workout.completed and (original_duration != workout.duration or original_calories != workout.calories_burned):
        # 先减去原来的
        update_user_stats_for_workout(current_user.id, add=False, 
                                     duration=original_duration, 
                                     calories=original_calories)
        # 再加上新的
        update_user_stats_for_workout(current_user.id, add=True, workout=workout)
    
    return jsonify({
        'message': '锻炼记录更新成功',
        'workout': workout.to_dict()
    })

@api_blueprint.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
@token_required
def delete_workout(current_user, workout_id):
    workout = Workout.query.get_or_404(workout_id)
    
    # 检查权限
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    # 如果删除已完成的锻炼，需要更新统计数据
    if workout.completed:
        update_user_stats_for_workout(current_user.id, add=False, 
                                     duration=workout.duration, 
                                     calories=workout.calories_burned)
    
    db.session.delete(workout)
    db.session.commit()
    
    return jsonify({'message': '锻炼记录删除成功'})

@api_blueprint.route('/api/workouts/<int:workout_id>/exercises', methods=['POST'])
@token_required
def add_exercise(current_user, workout_id):
    workout = Workout.query.get_or_404(workout_id)
    
    # 检查权限
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 验证必要字段
    if 'name' not in data:
        return jsonify({'message': '缺少必要字段: name'}), 400
    
    exercise = Exercise(
        workout_id=workout.id,
        name=data['name'],
        sets=data.get('sets'),
        reps=data.get('reps'),
        weight=data.get('weight'),
        completed=data.get('completed', False)
    )
    
    db.session.add(exercise)
    db.session.commit()
    
    return jsonify({
        'message': '运动项目添加成功',
        'exercise': exercise.to_dict()
    }), 201

@api_blueprint.route('/api/exercises/<int:exercise_id>', methods=['PUT'])
@token_required
def update_exercise(current_user, exercise_id):
    exercise = Exercise.query.get_or_404(exercise_id)
    workout = Workout.query.get(exercise.workout_id)
    
    # 检查权限
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 更新运动项目信息
    if 'name' in data:
        exercise.name = data['name']
    if 'sets' in data:
        exercise.sets = data['sets']
    if 'reps' in data:
        exercise.reps = data['reps']
    if 'weight' in data:
        exercise.weight = data['weight']
    if 'completed' in data:
        exercise.completed = data['completed']
    
    db.session.commit()
    
    return jsonify({
        'message': '运动项目更新成功',
        'exercise': exercise.to_dict()
    })

@api_blueprint.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
@token_required
def delete_exercise(current_user, exercise_id):
    exercise = Exercise.query.get_or_404(exercise_id)
    workout = Workout.query.get(exercise.workout_id)
    
    # 检查权限
    if workout.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    db.session.delete(exercise)
    db.session.commit()
    
    return jsonify({'message': '运动项目删除成功'})

# 辅助函数：更新用户统计信息
def update_user_stats_for_workout(user_id, add=True, workout=None, duration=None, calories=None):
    user_stat = UserStat.query.filter_by(user_id=user_id).first()
    if not user_stat:
        return
    
    # 使用workout参数或直接提供的duration/calories
    workout_duration = workout.duration if workout else duration
    workout_calories = workout.calories_burned if workout else calories
    
    # 增加或减少统计数据
    if add:
        user_stat.weekly_workouts += 1
        user_stat.monthly_workouts += 1
        if workout_duration:
            user_stat.weekly_duration += workout_duration
        if workout_calories:
            user_stat.weekly_calories += workout_calories
    else:
        user_stat.weekly_workouts = max(0, user_stat.weekly_workouts - 1)
        user_stat.monthly_workouts = max(0, user_stat.monthly_workouts - 1)
        if workout_duration:
            user_stat.weekly_duration = max(0, user_stat.weekly_duration - workout_duration)
        if workout_calories:
            user_stat.weekly_calories = max(0, user_stat.weekly_calories - workout_calories)
    
    user_stat.last_updated = datetime.utcnow()
    db.session.commit()