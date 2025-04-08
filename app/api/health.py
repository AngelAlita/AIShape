from flask import request, jsonify
from datetime import datetime, date, timedelta

from .. import db
from ..models import HealthMetric, User
from . import api_blueprint
from .auth import token_required

@api_blueprint.route('/api/health_metrics', methods=['GET'])
@token_required
def get_health_metrics(current_user):
    # 可以通过日期等参数过滤
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = HealthMetric.query.filter_by(user_id=current_user.id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(HealthMetric.date >= start)
        except:
            pass
            
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(HealthMetric.date <= end)
        except:
            pass
    
    metrics = query.order_by(HealthMetric.date.desc()).all()
    return jsonify([metric.to_dict() for metric in metrics])

@api_blueprint.route('/api/health_metrics/<int:metric_id>', methods=['GET'])
@token_required
def get_health_metric(current_user, metric_id):
    metric = HealthMetric.query.get_or_404(metric_id)
    
    # 检查是否是当前用户的健康数据
    if metric.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
        
    return jsonify(metric.to_dict())

@api_blueprint.route('/api/health_metrics/latest', methods=['GET'])
@token_required
def get_latest_health_metric(current_user):
    metric = HealthMetric.query.filter_by(user_id=current_user.id).order_by(HealthMetric.date.desc()).first()
    
    if not metric:
        return jsonify({'message': '未找到健康数据记录'}), 404
        
    return jsonify(metric.to_dict())

@api_blueprint.route('/api/health_metrics', methods=['POST'])
@token_required
def create_health_metric(current_user):
    data = request.json
    
    # 处理日期，如果未提供则使用今天
    metric_date = date.today()
    if 'date' in data and data['date']:
        try:
            metric_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            return jsonify({'message': '日期格式不正确，应为YYYY-MM-DD'}), 400
    
    # 检查该日期是否已存在记录
    existing = HealthMetric.query.filter_by(user_id=current_user.id, date=metric_date).first()
    if existing:
        return jsonify({
            'message': f'该日期({metric_date})已存在健康数据记录，请使用PUT方法更新',
            'metric_id': existing.id
        }), 409
    
    new_metric = HealthMetric(
        user_id=current_user.id,
        date=metric_date,
        weight=data.get('weight'),
        steps=data.get('steps'),
        calories_burned=data.get('calories_burned'),
        workout_duration=data.get('workout_duration'),
        sleep_duration=data.get('sleep_duration'),
        resting_heart_rate=data.get('resting_heart_rate')
    )
    
    db.session.add(new_metric)
    
    # 如果提供了体重，更新用户的当前体重和BMI
    if 'weight' in data and data['weight']:
        user = User.query.get(current_user.id)
        user.current_weight = data['weight']
        if user.height:
            height_m = user.height / 100  # 转换为米
            user.bmi = user.current_weight / (height_m * height_m)
    
    db.session.commit()
    
    return jsonify({
        'message': '健康数据记录创建成功',
        'health_metric': new_metric.to_dict()
    }), 201

@api_blueprint.route('/api/health_metrics/<int:metric_id>', methods=['PUT'])
@token_required
def update_health_metric(current_user, metric_id):
    metric = HealthMetric.query.get_or_404(metric_id)
    
    # 检查权限
    if metric.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    data = request.json
    
    # 更新健康指标信息
    if 'weight' in data:
        metric.weight = data['weight']
        # 如果是最新的记录，更新用户当前体重和BMI
        latest = HealthMetric.query.filter_by(user_id=current_user.id).order_by(HealthMetric.date.desc()).first()
        if latest and latest.id == metric.id:
            user = User.query.get(current_user.id)
            user.current_weight = data['weight']
            if user.height:
                height_m = user.height / 100  # 转换为米
                user.bmi = user.current_weight / (height_m * height_m)
    
    if 'steps' in data:
        metric.steps = data['steps']
    if 'calories_burned' in data:
        metric.calories_burned = data['calories_burned']
    if 'workout_duration' in data:
        metric.workout_duration = data['workout_duration']
    if 'sleep_duration' in data:
        metric.sleep_duration = data['sleep_duration']
    if 'resting_heart_rate' in data:
        metric.resting_heart_rate = data['resting_heart_rate']
    if 'date' in data:
        try:
            new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            # 检查新日期是否与其他记录冲突
            existing = HealthMetric.query.filter(
                HealthMetric.user_id == current_user.id,
                HealthMetric.date == new_date,
                HealthMetric.id != metric.id
            ).first()
            if existing:
                return jsonify({'message': f'该日期({new_date})已存在健康数据记录'}), 409
            metric.date = new_date
        except:
            pass
    
    db.session.commit()
    
    return jsonify({
        'message': '健康数据记录更新成功',
        'health_metric': metric.to_dict()
    })

@api_blueprint.route('/api/health_metrics/<int:metric_id>', methods=['DELETE'])
@token_required
def delete_health_metric(current_user, metric_id):
    metric = HealthMetric.query.get_or_404(metric_id)
    
    # 检查权限
    if metric.user_id != current_user.id:
        return jsonify({'message': '无权限访问'}), 403
    
    db.session.delete(metric)
    db.session.commit()
    
    # 如果删除的是包含最新体重的记录，尝试从其他记录更新用户当前体重
    if metric.weight:
        latest = HealthMetric.query.filter_by(user_id=current_user.id).order_by(HealthMetric.date.desc()).first()
        if latest and latest.weight:
            user = User.query.get(current_user.id)
            user.current_weight = latest.weight
            if user.height:
                height_m = user.height / 100  # 转换为米
                user.bmi = user.current_weight / (height_m * height_m)
            db.session.commit()
    
    return jsonify({'message': '健康数据记录删除成功'})

@api_blueprint.route('/api/health_metrics/stats', methods=['GET'])
@token_required
def get_health_stats(current_user):
    """获取健康统计数据，如体重趋势、平均步数等"""
    days = int(request.args.get('days', 7))
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    metrics = HealthMetric.query.filter(
        HealthMetric.user_id == current_user.id,
        HealthMetric.date >= start_date,
        HealthMetric.date <= end_date
    ).order_by(HealthMetric.date).all()
    
    # 计算各种统计数据
    weights = [m.weight for m in metrics if m.weight is not None]
    steps = [m.steps for m in metrics if m.steps is not None]
    sleep_durations = [m.sleep_duration for m in metrics if m.sleep_duration is not None]
    
    stats = {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': days
        },
        'weight': {
            'current': weights[-1] if weights else None,
            'change': (weights[-1] - weights[0]) if len(weights) > 1 else None,
            'avg': sum(weights) / len(weights) if weights else None,
            'min': min(weights) if weights else None,
            'max': max(weights) if weights else None,
            'trend': [{'date': m.date.isoformat(), 'weight': m.weight} for m in metrics if m.weight is not None]
        },
        'steps': {
            'avg': sum(steps) / len(steps) if steps else None,
            'max': max(steps) if steps else None,
            'total': sum(steps) if steps else None,
            'trend': [{'date': m.date.isoformat(), 'steps': m.steps} for m in metrics if m.steps is not None]
        },
        'sleep': {
            'avg': sum(sleep_durations) / len(sleep_durations) if sleep_durations else None,
            'trend': [{'date': m.date.isoformat(), 'hours': m.sleep_duration} for m in metrics if m.sleep_duration is not None]
        }
    }
    
    return jsonify(stats)