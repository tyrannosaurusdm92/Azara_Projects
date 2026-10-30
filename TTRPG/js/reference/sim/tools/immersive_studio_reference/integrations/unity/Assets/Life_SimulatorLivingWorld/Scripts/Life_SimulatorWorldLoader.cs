using System.IO;
using UnityEngine;

public class Life SimulatorWorldLoader : MonoBehaviour
{
    public string fileName = "life_simulator_living_world.json";
    public Life SimulatorWorldData World { get; private set; }

    public void LoadFromStreamingAssets()
    {
        string path = Path.Combine(Application.streamingAssetsPath, fileName);
        LoadFromPath(path);
    }

    public void LoadFromPersistentData()
    {
        string path = Path.Combine(Application.persistentDataPath, fileName);
        LoadFromPath(path);
    }

    public void LoadFromPath(string path)
    {
        if (!File.Exists(path))
        {
            Debug.LogWarning($"Life Simulator JSON not found: {path}");
            World = new Life SimulatorWorldData();
            return;
        }
        string json = File.ReadAllText(path);
        World = JsonUtility.FromJson<Life SimulatorWorldData>(json);
        Debug.Log($"Loaded Life Simulator world: {World?.npcs?.Count ?? 0} NPCs, {World?.locations?.Count ?? 0} locations");
    }
}
