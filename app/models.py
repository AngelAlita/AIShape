from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_image = db.Column(db.String(256))
    height = db.Column(db.Float)  # 单位cm
    current_weight = db.Column(db.Float)  # 单位kg
    initial_weight = db.Column(db.Float)  # 单位kg
    weight_goal = db.Column(db.Float)  # 单位kg
    bmi = db.Column(db.Float)
    body_fat_percentage = db.Column(db.Float)
    birthday = db.Column(db.Date)
    gender = db.Column(db.String(10))
    auth_token = db.Column(db.String(128))

    # 关联表关系
    meals = db.relationship('Meal', backref='user', lazy='dynamic')
    workouts = db.relationship('Workout', backref='user', lazy='dynamic')
    health_metrics = db.relationship('HealthMetric', backref='user', lazy='dynamic')
    achievements = db.relationship('Achievement', backref='user', lazy='dynamic')
    user_stats = db.relationship('UserStat', backref='user', uselist=False)

    def to_dict(self):
        return {
            "id": self.id, 
            "name": self.name, 
            "email": self.email,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile_image": self.profile_image,
            "height": self.height,
            "current_weight": self.current_weight,
            "initial_weight": self.initial_weight,
            "weight_goal": self.weight_goal,
            "bmi": self.bmi,
            "body_fat_percentage": self.body_fat_percentage,
            "birthday": self.birthday.isoformat() if self.birthday else None,
            "gender": self.gender
        }


class Meal(db.Model):
    __tablename__ = 'meals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 早餐/午餐/晚餐/加餐
    time = db.Column(db.String(10))
    total_calories = db.Column(db.Float, default=0)
    completed = db.Column(db.Boolean, default=False)
    
    # 关联表关系
    foods = db.relationship('Food', backref='meal', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "type": self.type,
            "time": self.time,
            "total_calories": self.total_calories,
            "completed": self.completed,
            "foods": [food.to_dict() for food in self.foods]
        }


class Food(db.Model):
    __tablename__ = 'foods'
    
    id = db.Column(db.Integer, primary_key=True)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.String(50))
    calories = db.Column(db.Float)
    protein = db.Column(db.Float)  # 单位g
    carbs = db.Column(db.Float)    # 单位g
    fat = db.Column(db.Float)      # 单位g
    
    def to_dict(self):
        return {
            "id": self.id,
            "meal_id": self.meal_id,
            "name": self.name,
            "amount": self.amount,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat
        }


class Workout(db.Model):
    __tablename__ = 'workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(20))  # 如 "09:30-10:30"
    duration = db.Column(db.Integer)  # 单位分钟
    calories_burned = db.Column(db.Float)
    completed = db.Column(db.Boolean, default=False)
    
    # 关联表关系
    exercises = db.relationship('Exercise', backref='workout', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "date": self.date.isoformat(),
            "time": self.time,
            "duration": self.duration,
            "calories_burned": self.calories_burned,
            "completed": self.completed,
            "exercises": [exercise.to_dict() for exercise in self.exercises]
        }


class Exercise(db.Model):
    __tablename__ = 'exercises'
    
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.Integer)
    weight = db.Column(db.String(20))
    completed = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "workout_id": self.workout_id,
            "name": self.name,
            "sets": self.sets,
            "reps": self.reps,
            "weight": self.weight,
            "completed": self.completed
        }


class HealthMetric(db.Model):
    __tablename__ = 'health_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    weight = db.Column(db.Float)
    steps = db.Column(db.Integer)
    calories_burned = db.Column(db.Float)
    workout_duration = db.Column(db.Integer)  # 单位分钟
    sleep_duration = db.Column(db.Float)      # 单位小时
    resting_heart_rate = db.Column(db.Integer)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "weight": self.weight,
            "steps": self.steps,
            "calories_burned": self.calories_burned,
            "workout_duration": self.workout_duration,
            "sleep_duration": self.sleep_duration,
            "resting_heart_rate": self.resting_heart_rate
        }


class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(100))
    color = db.Column(db.String(20))
    date_earned = db.Column(db.DateTime)
    completed = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "date_earned": self.date_earned.isoformat() if self.date_earned else None,
            "completed": self.completed
        }


class WorkoutTemplate(db.Model):
    __tablename__ = 'workout_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(20))
    estimated_duration = db.Column(db.Integer)  # 单位分钟
    target_area = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "difficulty": self.difficulty,
            "estimated_duration": self.estimated_duration,
            "target_area": self.target_area
        }


class UserStat(db.Model):
    __tablename__ = 'user_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    weekly_workouts = db.Column(db.Integer, default=0)
    weekly_calories = db.Column(db.Float, default=0)
    weekly_duration = db.Column(db.Integer, default=0)  # 单位分钟
    monthly_workouts = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)  # 连续训练天数
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "weekly_workouts": self.weekly_workouts,
            "weekly_calories": self.weekly_calories,
            "weekly_duration": self.weekly_duration,
            "monthly_workouts": self.monthly_workouts,
            "streak": self.streak,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }