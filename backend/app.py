from flask import flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime

app = flask(__name__)
CORS(app)

queues = {}

@app.route("/api/create_queue", methods=["POST"])
def create_queue():
    data = request.json
    queue_id = str(uuid.uuid4())[:8]
    queues[queue_id] = {
        "id": queue_id,
        "name": data.get("name", "Untitled"),
        "description": data.get("description", ""),
        "location": data.get("location", ""),
        "timePerPerson": data.get("timePerPerson", 5),
        "createdAt": str(datetime.utcnow()),
        "isActive": True,
        "people": []
    }
    return jsonify(queues[queue_id])

@app.route("/api/join_queue", methods=["POST"])
def join_queue():
    data = request.json
    queue_id = data["queueId"]
    person = {
        "id": str(uuid.uuid4()),
        "name": data["name"],
        "joinedAt": str(datetime.utcnow()),
        "contactInfo": data.get("contactInfo", "")
    }
    if queue_id in queues and queues[queue_id]["isActive"]:
        queues[queue_id]["people"].append(person)
        return jsonify({"success": True, "person": person})
    return jsonify({"success": False, "error": "Queue not found or inactive"}), 404

@app.route("/api/get_queue/<queue_id>", methods=["GET"])
def get_queue(queue_id):
    queue = queues.get(queue_id)
    if queue:
        return jsonify(queue)
    return jsonify({"error": "Queue not found"}), 404

@app.route("/api/call_next/<queue_id>", methods=["POST"])
def call_next(queue_id):
    if queue_id in queues and queues[queue_id]["people"]:
        return jsonify(queues[queue_id]["people"][0])
    return jsonify({"error": "Queue empty or not found"}), 404

@app.route("/api/remove_person", methods=["POST"])
def remove_person():
    data = request.json
    queue_id = data["queueId"]
    person_id = data["personId"]
    if queue_id in queues:
        queues[queue_id]["people"] = [p for p in queues[queue_id]["people"] if p["id"] != person_id]
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route("/api/end_queue/<queue_id>", methods=["POST"])
def end_queue(queue_id):
    if queue_id in queues:
        queues[queue_id]["isActive"] = False
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

if __name__ == "__main__":
    app.run(debug=True)