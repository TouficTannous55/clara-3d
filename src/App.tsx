import React from "react";

import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import "./App.css";
import { SceneLoader } from "./SceneLoader";
import { scene } from "./scenes/scene4";

// DOCUMENTATION
// "scene" contains and array of tile definitions
// r - row
// c - column
// tid - tileid     "1 - tree", "4 - player"
// d - direction "0 - north", "1 - east", "2 - south", "3 - west"

function App() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    let sceneLoader = new SceneLoader();
    sceneLoader.initCanvas(ref.current).then(() => {
      sceneLoader.loadScene(scene);
    });

    // const canvas = ref.current;
    // const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

    // const scene = new BABYLON.Scene(engine);

    // const camera = new BABYLON.ArcRotateCamera(
    //   "camera",
    //   -Math.PI / 2,
    //   Math.PI / 2.5,
    //   3,
    //   new BABYLON.Vector3(0, 0, 0),
    //   scene
    // );
    // camera.attachControl(canvas, true);

    // const light = new BABYLON.HemisphericLight(
    //   "light",
    //   new BABYLON.Vector3(0, 1, 0),
    //   scene
    // );

    // // one way
    // // let result = BABYLON.SceneLoader.AppendAsync("/tile_1.glb");
    // // result.then((s) => (s.autoClearDepthAndStencil = true));

    // // another
    // BABYLON.SceneLoader.ImportMesh("", "/", "tile_1.glb", scene, function (m) {
    //   m.forEach((mesh) => {
    //     // THIS IS THE ALMIGHTY FIX THAT SOLVES THE CLIPPING ISSUES
    //     if (mesh.material) {
    //       mesh.material.needDepthPrePass = true;
    //     }
    //   });
    // });

    // // scene.enableDepthRenderer();

    // // BABYLON.SceneLoader.ImportMesh("", "/", "tile_1.glb", scene, function (m) {
    // //   m.forEach((mesh) => {
    // //     mesh.position = new BABYLON.Vector3(0, 0, 0);
    // //   });
    // //   console.log(m);
    // // });

    // window.addEventListener("resize", function () {
    //   engine.resize();
    // });

    // engine.runRenderLoop(function () {
    //   scene.render();
    // });
  }, []);

  //console.log("Render");
  //console.log(ref.current);

  return (
    <div className="App" style={{ width: "100%", height: "100%" }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export default App;
