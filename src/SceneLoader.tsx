// imports & includes
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';

import { Atlas, preloadMeshes } from './MeshLoader';

// board details object
type SceneDefinition = {
  rows: number;
  columns: number;
  tiles: Array<{ r: number; c: number; d: number; tid: number }>;
};

// sceneloader class
export class SceneLoader {
  scene: BABYLON.Scene; // global scene var
  light: BABYLON.HemisphericLight; // global light var
  assetsManager: BABYLON.AssetsManager; // global assetmanager
  detailLevel = 3; // level of detail variable (NOT WORKING)
  trees = []; // global tree array
  claraGlobalGui: GUI.AdvancedDynamicTexture;
  playerAnimator: BABYLON.AnimationGroup;

  // canvas initiation
  async initCanvas(canvas: HTMLCanvasElement) {
    let engine = new BABYLON.Engine(canvas, true);

    // create scene function
    var createScene = () => {
      let scene = new BABYLON.Scene(engine);
      this.scene = scene;
      scene.clearColor = BABYLON.Color3.White() as unknown as BABYLON.Color4;

      // create camera
      let camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        BABYLON.Tools.ToRadians(25),
        30,
        new BABYLON.Vector3(11, -2, 13.5),
        scene
      );

      // set camera default camera angle (cam2)
      // camera.lowerBetaLimit = Math.PI/2;
      // camera.upperBetaLimit = Math.PI/3;
      // camera.lowerRadiusLimit = 30;
      // camera.upperRadiusLimit = 30;

      // set camera sensitivity
      camera.angularSensibilityX = 5000;
      camera.angularSensibilityY = 5000;

      camera.checkCollisions = true;
      camera.attachControl("canvas", true);

      // create gui overlay
      var claraGUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "UI",
        true,
        this.scene
      );
      this.claraGlobalGui = claraGUI;

      // create stacks for gui
      var buttonPanel = new GUI.StackPanel();
      var sliderPanel = new GUI.StackPanel();

      // set up stackPanel
      buttonPanel.isVertical = false;
      buttonPanel.height = "50px";
      buttonPanel.width = "150px";
      buttonPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      buttonPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      claraGUI.addControl(buttonPanel);

      // set up sliderPanel
      sliderPanel.width = "220px";
      sliderPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      sliderPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      claraGUI.addControl(sliderPanel);

      // create camera angle buttons
      //    - cam1 = angle 1 (higher)
      //    - cam2 = angle 2 (lower)
      //    - cam3 = angle 3 (limited-free range) - NEEDS TO BE IMPLEMENTED
      // NEED BUTTON ICONS
      var cam1 = GUI.Button.CreateImageOnlyButton("cam1", "/top.png");
      var cam2 = GUI.Button.CreateImageOnlyButton("cam2", "/side.png");
      var cam3 = GUI.Button.CreateImageOnlyButton("cam3", "/free.png");

      // set up cam1 button and handler
      cam1.width = "50px";
      cam1.height = "50px";
      cam1.color = "transparent";
      cam1.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.upperBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });
      buttonPanel.addControl(cam1);

      // set up cam2 button and handler
      cam2.width = "50px";
      cam2.height = "50px";
      cam2.color = "transparent";
      cam2.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = Math.PI / 2;
        camera.upperBetaLimit = Math.PI / 3;
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });
      buttonPanel.addControl(cam2);

      // set up cam3 button and handler
      cam3.width = "50px";
      cam3.height = "50px";
      cam3.color = "transparent";
      cam3.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = 0;
        camera.upperBetaLimit = 0;
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = 0;
      });
      buttonPanel.addControl(cam3);

      // create detail slider heading
      var detailSliderHeading = new GUI.TextBlock();
      detailSliderHeading.text = "Detail Level: High";
      detailSliderHeading.height = "20px";
      detailSliderHeading.color = "black";
      sliderPanel.addControl(detailSliderHeading);

      // create and set up detail slider
      var detailSlider = new GUI.Slider();
      detailSlider.minimum = 1;
      detailSlider.maximum = 3;
      detailSlider.value = 3;
      detailSlider.height = "20px";
      detailSlider.width = "200px";
      detailSlider.onValueChangedObservable.add(function (value) {
        if (value == 1) {
          detailSliderHeading.text = "Detail Level: Low";
          this.detailLevel = 1;
          console.log(this.detailLevel);
          this.trees[40].dispose();
          // console.log("length of trees array ", this.trees.length);
          // createScene();
        } else if (value > 1 && value != 3) {
          detailSlider.value = 2;
          detailSliderHeading.text = "Detail Level: Medium";
          // this.detailLevel = 2;
          // console.log(this.detailLevel);
        } else if (value == 3) {
          detailSliderHeading.text = "Detail Level: High";
          // this.detailLevel = 3;
          // console.log(this.detailLevel);
        }
        // SWITCH STATEMENT SCRAPPED UNTIL SLIDER CAN LOCK ONTO 2
        // switch(value) {
        //   case 1: {
        //     detailSliderHeading.text = "Detail Level: Low";
        //     break;
        //   }
        //   case 2: {
        //     detailSliderHeading.text = "Detail Level: Medium";
        //     break;
        //   }
        //   case 3: {
        //     detailSliderHeading.text = "Detail Level: High";
        //     break;
        //   }
        //   default: {
        //     break;
        //   }
        // }
      });
      sliderPanel.addControl(detailSlider);

      let idleButton = GUI.Button.CreateSimpleButton("Idle", "Idle");
      idleButton.width = 0.2;
      idleButton.height = "40px";
      idleButton.color = "white";
      idleButton.background = "green";
      idleButton.width = "150px";
      idleButton.onPointerClickObservable.add(() => {
        this.playerAnimator.stop();
        this.playerAnimator.start(true, 1, 0, 58);
      });

      let walkButton = GUI.Button.CreateSimpleButton("Walk", "Walk");
      walkButton.width = 0.2;
      walkButton.height = "40px";
      walkButton.color = "white";
      walkButton.background = "green";
      walkButton.width = "150px";
      walkButton.onPointerClickObservable.add(() => {
        this.playerAnimator.stop();
        this.playerAnimator.start(true, 1, 60, 160);
      });

      sliderPanel.addControl(idleButton);
      sliderPanel.addControl(walkButton);

      /* NEED TO GET SHADOWS WORKING */
      // create light
      let light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
        scene
      );
      this.light = light;

      // enable depth renderering and return scene
      scene.enableDepthRenderer();
      return scene;
    };

    // screen resizing
    window.addEventListener("resize", function () {
      engine.resize();
    });

    // create scene
    var scene = createScene();
    // assign asset manager
    this.assetsManager = new BABYLON.AssetsManager(scene);

    // load meshes
    console.log("Preloading ...");
    await preloadMeshes(this.assetsManager);
    console.log("Loaded");

    // render scene
    engine.runRenderLoop(function () {
      scene.render();
    });
  }

  // load scene function
  loadScene(definition: SceneDefinition) {
    // assign rows n cols
    let { rows, columns } = definition;

    // create board loop
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        // find current tile
        let existingTile = definition.tiles.find(
          (t) => t.c === columnIndex && t.r === rowIndex
        );

        // if current tile exists check specifications
        // else place light grass
        if (existingTile) {
          // tid == 1, place dark grass + tree
          if (existingTile.tid == 1) {
            let top = Atlas.topTiles.get("GrassTop1.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
            this.getTree(rowIndex * 2.1, columnIndex * 2.1);
          }
          // tid == 2, place water
          else if (existingTile.tid == 2) {
            let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
            /*
               if tile on edge, put waterfall
            */
          }
          // existing tile is game object (clara, leaf, ghost), place lighter grass
          else if (
            [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].indexOf(
              existingTile.tid
            ) > -1
          ) {
            let top = Atlas.topTiles.get("GrassTop2.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
            switch (existingTile.tid) {
              case 4: {
                /* PLACE HOLDER BOX */
                // var box = BABYLON.Mesh.CreateBox("Box", 1.0, this.scene);
                // box.position = new BABYLON.Vector3(
                //   rowIndex * 2.1,
                //   1.5,
                //   columnIndex * 2.1
                // );
                let sc = this.scene;

                BABYLON.SceneLoader.ImportMesh(
                  "",
                  "./",
                  "clara.glb",
                  this.scene,
                  (meshes, ps, skeletons, ags) => {
                    meshes.forEach((mesh) => {
                      if (mesh.material) {
                        mesh.material.needDepthPrePass = true;
                      }
                    });
                    let tile = meshes[0];
                    tile.position = new BABYLON.Vector3(
                      rowIndex * 2.1,
                      1,
                      columnIndex * 2.1
                    );

                    this.playerAnimator = ags[0];
                    this.playerAnimator.stop();

                    //var skeleton = skeletons[0];
                    //sc.stopAnimation(skeleton);
                    //sc.beginAnimation(skeleton, 0, 29, true, 2.0);
                  }
                );
                break;
              }
              case 5: {
                // leaf
                break;
              }
              case 6: {
                // mushroom
                break;
              }
              case 7: {
                // ghost
                break;
              }
              case 8: {
                // ghostWall
                break;
              }
              case 9: {
                // ghostHealer
                break;
              }
              case 10: {
                // home
                break;
              }
              case 11: {
                // dot
                break;
              }
              case 12: {
                // earth
                break;
              }
              case 13: {
                // gold
                break;
              }
              case 14: {
                // brokenGold
                break;
              }
              case 15: {
                // pheromone
                break;
              }
              default: {
                break;
              }
            }
          }
        }
        // undefined tile == place light grass (path)
        else {
          let top = Atlas.topTiles.get("GrassTop2.glb").createInstance("top");
          top.position = new BABYLON.Vector3(
            rowIndex * 2.1,
            0,
            columnIndex * 2.1
          );
        }
      }

      // TESTING OUT-OF-SCOPE ISSUE
      // var sliderPanel = new GUI.StackPanel();
      // this.claraGlobalGui.addControl(sliderPanel);

      // // create detail slider heading
      // var detailSliderHeading = new GUI.TextBlock();
      // detailSliderHeading.text = "Detail Level: High";
      // detailSliderHeading.height = "20px";
      // detailSliderHeading.color = "black";
      // sliderPanel.addControl(detailSliderHeading);

      // // create and set up detail slider
      // var detailSlider = new GUI.Slider();
      // detailSlider.minimum = 1;
      // detailSlider.maximum = 3;
      // detailSlider.value = 3;
      // detailSlider.height = "20px";
      // detailSlider.width = "200px";
      // detailSlider.onValueChangedObservable.add(function (value) {
      //   if (value == 1) {
      //     detailSliderHeading.text = "Detail Level: Low";
      //     this.detailLevel = 1;
      //     console.log(this.detailLevel);
      //     this.trees[40].dispose();
      //     // console.log("length of trees array ", this.trees.length);
      //     // createScene();
      //   }
      //   else if (value > 1 && value != 3) {
      //     detailSlider.value = 2;
      //     detailSliderHeading.text = "Detail Level: Medium";
      //     // this.detailLevel = 2;
      //     // console.log(this.detailLevel);
      //   }
      //   else if (value == 3) {
      //     detailSliderHeading.text = "Detail Level: High";
      //     // this.detailLevel = 3;
      //     // console.log(this.detailLevel);
      //   }
      //             // SWITCH STATEMENT SCRAPPED UNTIL SLIDER CAN LOCK ONTO 2
      //             // switch(value) {
      //             //   case 1: {
      //             //     detailSliderHeading.text = "Detail Level: Low";
      //             //     break;
      //             //   }
      //             //   case 2: {
      //             //     detailSliderHeading.text = "Detail Level: Medium";
      //             //     break;
      //             //   }
      //             //   case 3: {
      //             //     detailSliderHeading.text = "Detail Level: High";
      //             //     break;
      //             //   }
      //             //   default: {
      //             //     break;
      //             //   }
      //             // }
      //   });
      //   sliderPanel.addControl(detailSlider);
    }

    /* NEED TO GET BOTTOM OF ISLAND SCALING */ // island is 4.5 tiles x 4.5 tiles
    BABYLON.SceneLoader.ImportMesh(
      "",
      "./",
      "island.glb",
      this.scene,
      function (meshes) {
        meshes.forEach((mesh) => {
          if (mesh.material) {
            mesh.material.needDepthPrePass = true;
          }
        });
        let tile = meshes[0];
        var rowCentre = (rows * 2.1 - 2.1) / 2;
        var colCentre = (columns * 2.1 - 2.1) / 2;
        tile.position = new BABYLON.Vector3(rowCentre, 1.5, colCentre);
        tile.scaling = new BABYLON.Vector3(rows / 4.5, 1.8, columns / 4.5);
      }
    );

    // testing
    console.log("array of trees ", this.trees);
    this.trees[40].dispose();
    console.log("length of trees array ", this.trees.length);
  }

  // function to generate random tree
  // tree preferences:
  //    - Group 1: Tree1 - Tree7 (<50kb)
  //    - Group 2: Tree1 - Tree12 (<80kb)
  //    - Group 3: Tree1 - Tree15 (<200kb)
  getTree(xcoord, zoord) {
    let tree = "Tree";
    ///tree += Math.floor(Math.random() * 15) + 1;

    let treelevel = 3;
    if (treelevel == 1) {
      tree += Math.floor(Math.random() * 7) + 1;
    } else if (treelevel == 2) {
      tree += Math.floor(Math.random() * 12) + 1;
    } else if (treelevel == 3) {
      tree += Math.floor(Math.random() * 15) + 1;
    }

    let mesh = Atlas.trees.get(tree + ".glb").createInstance("");
    mesh.position = new BABYLON.Vector3(xcoord, 1.6, zoord);
    mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
    this.trees.push(mesh);
  }
}
