from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from flask_cors import CORS  # 需要安装：pip install flask-cors

db = SQLAlchemy()

def create_app():
    load_dotenv()  # 加载 .env

    app = Flask(__name__)
    app.config.from_object("app.config.Config")
    CORS(app)  # 启用跨域支持
    
    db.init_app(app)
    from .api import api_blueprint
    app.register_blueprint(api_blueprint)

    with app.app_context():
        db.create_all()

    return app
