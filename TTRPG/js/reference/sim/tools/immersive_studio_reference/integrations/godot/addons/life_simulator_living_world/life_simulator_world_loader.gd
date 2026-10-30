extends Node
class_name Life SimulatorWorldLoader

var world_data: Dictionary = {}

func load_world(path: String = "res://data/life_simulator_living_world.json") -> Dictionary:
    if not FileAccess.file_exists(path):
        push_warning("Life Simulator file not found: %s" % path)
        return {}
    var file := FileAccess.open(path, FileAccess.READ)
    var text := file.get_as_text()
    var parsed = JSON.parse_string(text)
    if typeof(parsed) != TYPE_DICTIONARY:
        push_error("Life Simulator JSON did not parse as a Dictionary.")
        return {}
    world_data = parsed
    return world_data

func get_npc_by_name(npc_name: String) -> Dictionary:
    for npc in world_data.get("npcs", []):
        if str(npc.get("name", "")) == npc_name:
            return npc
    return {}

func get_locations_by_settlement(settlement_name: String) -> Array:
    var results: Array = []
    for loc in world_data.get("locations", []):
        if str(loc.get("settlement", "")) == settlement_name:
            results.append(loc)
    return results
