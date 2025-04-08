from flask import Blueprint

api_blueprint = Blueprint('api', __name__)

# 不要在这里导入模块，而是在每个模块中导入api_blueprint
# 在文件底部才导入各个模块以避免循环导入问题
from . import auth, users, meals, workouts, health, achievements, templates
