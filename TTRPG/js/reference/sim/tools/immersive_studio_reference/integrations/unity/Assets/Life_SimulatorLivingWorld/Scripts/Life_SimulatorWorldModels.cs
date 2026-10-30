using System;
using System.Collections.Generic;

[Serializable]
public class Life SimulatorWorldData
{
    public string schema;
    public Life SimulatorSettings settings;
    public List<Life SimulatorNpc> npcs = new();
    public List<Life SimulatorLocation> locations = new();
    public List<Life SimulatorRelationship> relationships = new();
    public List<Life SimulatorTravelRecord> travel = new();
}

[Serializable] public class Life SimulatorSettings { public string scopeMode; public string province; public string settlementName; public string settlementType; public string biome; }
[Serializable] public class Life SimulatorNpc { public string id; public string name; public string race; public string settlement; public string province; public string residence; public string employment; public string currentLocation; public string status; }
[Serializable] public class Life SimulatorLocation { public string id; public string name; public string settlement; public string province; public string category; public string subcategory; public string description; }
[Serializable] public class Life SimulatorRelationship { public string id; public string fromId; public string toId; public string fromName; public string toName; public string label; public string layer; }
[Serializable] public class Life SimulatorTravelRecord { public string id; public string npcId; public string npcName; public string origin; public string destination; public string mode; public string reason; }
