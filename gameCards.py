import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, session
from flask_restful import Api, Resource
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

app = Flask(__name__)

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Allows cookie to persist on navigation
app.config['SESSION_COOKIE_SECURE'] = False     # Set to True only if using HTTPS
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
CORS(app, supports_credentials=True)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
#what comes after is a replacement in case sqlalchemy throws an error
db_url = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
if db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
api = Api(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    display_name = db.Column(db.String(100))
    email = db.Column(db.String(120))


class Game(db.Model): #new stuff
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    platform = db.Column(db.String(100))
    progress = db.Column(db.Integer, default=0)
    rawg_id = db.Column(db.Integer)
    cover_image = db.Column(db.String(500))

class Login(Resource):
    def post(self):
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return {"message": "Username and password required"}, 400

        user = User.query.filter_by(username=username).first()
        
        if user and bcrypt.check_password_hash(user.password, password):
            session['user_id'] = user.id
            return {"message": "Login successful"}, 200
        else:
            return {"message": "Invalid credentials"}, 401

api.add_resource(Login, "/login")

class Register(Resource):
    def post(self):
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        display_name = data.get('display_name')
        email = data.get('email')

        if not username or not password:
            return {"message": "Username and password required"}, 400

        if User.query.filter_by(username=username).first():
            return {"message": "Username already taken"}, 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password=hashed_password, display_name=display_name, email=email)
        db.session.add(new_user)
        db.session.commit()

        #new user notification
        welcome_notif = Notification(
            user_id=new_user.id,
            message="Welcome to your gaming library!"
        )
        db.session.add(welcome_notif)
        db.session.commit()
        return {"message": "User created successfully"}, 201

api.add_resource(Register, "/register")

class Logout(Resource):
    def post(self):
        session.pop('user_id', None)
        return {"message": "Logged out"}, 200
api.add_resource(Logout, "/logout")

class WhoAmI(Resource):
    def get(self):
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            return {
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name
            }, 200
        return {"message": "Not logged in"}, 401
    
api.add_resource(WhoAmI, "/whoami")


#class Cards(Resource):
#    def get(self):
#        games = [
#            {"name": "Skullgirls", "platform": "Mobile Version", "progress": 1, "image": "images/skullgirls.png"},
#            {"name": "Blades of Brim", "platform": "PC Version", "progress": 69, "image": "images/BladesofBrim.png"},
#            {"name": "Amazing Spiderman 2", "platform": "Mobile Version", "progress": 20, "image": "images/amazingspiderman.png"}
#        ]
#        return games
#
#api.add_resource(Cards, "/cards")

#new stuff
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)

class Games(Resource):
    def get(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401

        games = Game.query.filter_by(user_id=session['user_id']).all()
        return [
            {
                "id": g.id,
                "name": g.name,
                "platform": g.platform,
                "progress": g.progress,
                "cover_image": g.cover_image
            } for g in games
        ], 200

    def post(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401

        data = request.get_json() or {}
        name = data.get('name')
        platform = data.get('platform')

        if not name:
            return {"message": "Game name required"}, 400

        new_game = Game(
            user_id=session['user_id'],
            name=name,
            platform=platform,
            progress=data.get('progress', 0),
            rawg_id=data.get('rawg_id'),
            cover_image=data.get('cover_image')
        )
        db.session.add(new_game)

        
        
        #create notification for new game
        notif_msg = f'"{name}" was added to your library'
        if platform:
            notif_msg += f' ({platform})'
        new_notif = Notification(user_id=session['user_id'], message=notif_msg)
        db.session.add(new_notif)

        db.session.commit()
        return {"message": "Game added", "id": new_game.id}, 201
api.add_resource(Games, "/games")

#notifications resource
class Notifications(Resource):
    def get(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        
        notifs = Notification.query.filter_by(user_id=session['user_id']).order_by(Notification.id.desc()).all()
        return [{"id": n.id, "message": n.message} for n in notifs], 200

    def delete(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        
        Notification.query.filter_by(user_id=session['user_id']).delete()
        db.session.commit()
        return {"message": "All notifications cleared"}, 200

class NotificationDetail(Resource):
    def delete(self, notif_id):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        
        notif = Notification.query.get(notif_id)
        if not notif or notif.user_id != session['user_id']:
            return {"message": "Notification not found"}, 404

        db.session.delete(notif)
        db.session.commit()
        return {"message": "Notification deleted"}, 200

api.add_resource(Notifications, "/notifications")
api.add_resource(NotificationDetail, "/notifications/<int:notif_id>")


#cart logic
class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)

class Cart(Resource):
    def get(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        items = CartItem.query.filter_by(user_id=session['user_id']).all()
        return [{"id": item.id, "name": item.name} for item in items], 200

    def delete(self):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        CartItem.query.filter_by(user_id=session['user_id']).delete()
        db.session.commit()
        return {"message": "Cart cleared"}, 200

    def post(self):
            if 'user_id' not in session:
                return {"message": "Not logged in"}, 401
            data = request.get_json() or {}
            name = data.get('name')
            if not name:
                return {"message": "Item name required"}, 400

            new_item = CartItem(user_id=session['user_id'], name=name)
            db.session.add(new_item)
            db.session.commit()
            return {"message": "Item added to cart", "id": new_item.id}, 201

class CartItemDetail(Resource):
    def delete(self, item_id):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401
        item = CartItem.query.get(item_id)
        if not item or item.user_id != session['user_id']:
            return {"message": "Item not found"}, 404
        db.session.delete(item)
        db.session.commit()
        return {"message": "Item removed"}, 200

# Route Registrations
api.add_resource(Cart, "/cart")
api.add_resource(CartItemDetail, "/cart/<int:item_id>")

#Game Details
class GameDetail(Resource):
    def patch(self, game_id):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401

        game = Game.query.get(game_id)
        if not game or game.user_id != session['user_id']:
            return {"message": "Game not found"}, 404

        data = request.get_json() or {}
        if 'progress' in data:
            game.progress = data['progress']
        db.session.commit()
        return {"message": "Game updated"}, 200

    def delete(self, game_id):
        if 'user_id' not in session:
            return {"message": "Not logged in"}, 401

        game = Game.query.get(game_id)
        if not game or game.user_id != session['user_id']:
            return {"message": "Game not found"}, 404

        db.session.delete(game)
        db.session.commit()
        return {"message": "Game deleted"}, 200

api.add_resource(GameDetail, "/games/<int:game_id>")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)


