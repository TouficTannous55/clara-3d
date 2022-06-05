import * as BABYLON from "@babylonjs/core";

export const Atlas = {
  topTiles: new Map<string, BABYLON.Mesh>(),
  trees: new Map<string, BABYLON.Mesh>(),
  grass: new Map<string, BABYLON.Mesh>(),
  tallGrass: new Map<string, BABYLON.Mesh>(),
  stones: new Map<string, BABYLON.Mesh>(),
  mushrooms: new Map<string, BABYLON.Mesh>(),
  leaves: new Map<string, BABYLON.Mesh>(),
  towers: new Map<string, BABYLON.Mesh>(),
  claras: new Map<string, BABYLON.Mesh>(),
  // etc, lots
};

let tiles: { [index: string]: string[] } = {
  topTiles: [
    "GrassTop1.glb", 
    "GrassTop2.glb",
    "WaterTop.glb",
  ],
  trees: [
    "Tree1.glb",
    "Tree2.glb",
    "Tree3.glb",
    "Tree4.glb",
    "Tree5.glb",
    "Tree6.glb",
    "Tree7.glb",
    "Tree8.glb",
    "Tree9.glb",
    "Tree10.glb",
    "Tree11.glb",
    "Tree12.glb",
    "Tree13.glb",
    "Tree14.glb",
    "Tree15.glb",
  ],
  grass: [
    "GrassSet1.glb",
    "GrassSet2.glb",
    "GrassSet3.glb",
    "GrassSet4.glb",
    "GrassSet5.glb",
  ],
  tallGrass: [
    "TallGrass1.glb",
    "TallGrass2.glb",
    "TallGrass3.glb",
    "TallGrass4.glb",
    "TallGrass5.glb",
  ],
  stones: [
    "Stones1.glb",
    "Stones2.glb",
  ],
  mushrooms: [
    "Mushrooms1.glb",
    "Mushrooms2.glb",
    "Mushrooms3.glb",
    "Mushrooms4.glb",
  ],
  leaves: [],
  towers: [
    "Tower1.glb",
    "Tower2.glb",
    "Tower3.glb",
  ],
  claras: [
    "clara.glb",
  ],
};

export function preloadMeshes(assetsManager: BABYLON.AssetsManager) {
  let totalToLoad = Object.keys(tiles).reduce((p, n) => p + tiles[n].length, 0);

  return new Promise<void>((resolve, reject) => {
    for (let key of Object.keys(tiles)) {
      let paths = tiles[key];

      // for some reason the main mesh is on index 1 not 0 in all other meshes but island
      let meshIndex = key === "islands" ? 2 : 1;

      for (let path of paths) {
        const root = `./`;
        const name = ""; // `load ${root}${path}`;
        const meshTask = assetsManager.addMeshTask(name, "", root, path);

        // if we fail to load the mesh we reject this asynchronous task
        meshTask.onError = () => {
          reject();
        };

        meshTask.onSuccess = (task) => {
          // disable the original mesh and store it in the Atlas
          task.loadedMeshes[0].setEnabled(false);
          Atlas[key].set(path, task.loadedMeshes[meshIndex]);

          // we need a prepass for better depth rendering
          task.loadedMeshes.forEach((mesh) => {
            if (mesh.material) {
              mesh.material.needDepthPrePass = true;
            }
          });

          // check if we loaded everything
          totalToLoad--;

          if (totalToLoad == 0) {
            resolve();
          }
        };
      }
    }
    assetsManager.load();
  });
}
