from flask import render_template, Flask

app = Flask()

@app.route("/")
def index():
    return render_template("index.html")