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

// delay for speed settings
const delay = ms => new Promise(res => setTimeout(res, ms));

// sceneloader class
export class SceneLoader {
  // general variables
  scene: BABYLON.Scene;                 // global scene var
  light: BABYLON.HemisphericLight;      // global light var
  camera: BABYLON.ArcRotateCamera;      // global camera var
  assetsManager: BABYLON.AssetsManager; // global assetmanager
  detailLevel: number;                  // level of detail variable
  glbDef: SceneDefinition;              // global scene definition

  // clara variables
  playerAnimator: BABYLON.AnimationGroup; // clara animation
  clara: BABYLON.AbstractMesh;            // clara herself 
  
  // movement variables
  directionFacing: number;          // direction clara is facing (0 - north, 1 - east, 2 - south, 3 - west)
  startPosition: BABYLON.Vector3;   // clara's start position
  currentPosition: BABYLON.Vector3; // clara's current position
  movementGrid = [];                // board grid
  claraXCoord: number;              // xcoord in grid
  claraYCoord: number;              // ycoord in grid
  justMoved = false;                // movement check
  leavesCollected: number;          // leaf count
  alive = true;                     // alive check

  // speed settings and variables
  deathSpeed = [400, 800, 1600, 100];     
  turnSpeed = [150, 300, 600, 50];
  framesSpeed = [120, 60, 30, 480];
  moveWaitSpeed = [550, 1100, 2200, 200];
  currentDeathSpeed: number;
  currentTurnSpeed: number;
  currentFrameSpeed: number;
  currentMoveWaitSpeed: number;

  // canvas initiation
  async initCanvas(canvas: HTMLCanvasElement) {
    let engine = new BABYLON.Engine(canvas, true);

    // create scene function
    var createScene = (passedDL: number) => {

      // create scene
      let scene = new BABYLON.Scene(engine);
      // assign scene to global
      this.scene = scene;
      // set bg colour
      scene.clearColor = BABYLON.Color3.White() as unknown as BABYLON.Color4;

      // calls create fog function
      this.createFog();

      // set defaults
      this.leavesCollected = 0;
      this.currentDeathSpeed = this.deathSpeed[1];
      this.currentTurnSpeed = this.turnSpeed[1];
      this.currentFrameSpeed = this.framesSpeed[1];
      this.currentMoveWaitSpeed = this.moveWaitSpeed[1];

      // assign detail level
      this.detailLevel = passedDL;

      // create camera
      let camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        BABYLON.Tools.ToRadians(25),
        30,
        BABYLON.Vector3.Zero(),
        //new BABYLON.Vector3(11, -2, 13.5),
        scene
      );

      //camera.setTarget(new BABYLON.Vector3(11, -2, 13.5));
      // camera.target.x = 11;
      // camera.target.y = -2;
      // camera.target.z = 13.5;

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
      this.camera = camera;
      
      /* BELOW IS FOR MINIMAP CODE, NOT SURE ABT IT YET 
      var camera2 = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 0.001, 60, new BABYLON.Vector3(11, -2, 13.5), scene);
      scene.activeCameras = [];
      // scene.activeCameras.push(camera2);
      scene.activeCameras.push(camera);
      camera.attachControl(canvas, true);
      camera2.attachControl(canvas, true);

	    camera2.layerMask = 2;
      
	    var epsilon = .9999999;  // threshold

      var rt2 = new BABYLON.RenderTargetTexture("depth", 1024, scene, true, true);
      scene.customRenderTargets.push(rt2);
	    rt2.activeCamera = camera2;
      rt2.renderList = scene.meshes;

      var mon2 = BABYLON.Mesh.CreatePlane("plane", 4, scene);
      mon2.position = new BABYLON.Vector3(canvas.width/130, canvas.height/150, 20)
	    // mon2.showBoundingBox = true;
      var mon2mat = new BABYLON.StandardMaterial("texturePlane", scene);
      mon2mat.diffuseColor = new BABYLON.Color3(1,1,1);
      mon2mat.diffuseTexture = rt2;
      mon2mat.specularColor = BABYLON.Color3.Black();

      mon2mat.diffuseTexture.scale(1);
      // mon2mat.diffuseTexture.scale = 1; // zoom
      // mon2mat.diffuseTexture.vScale = 1;

      mon2mat.diffuseTexture.level = 1.2; // intensity

      mon2mat.emissiveColor = new BABYLON.Color3(1,1,1); // backlight
	    mon2.material = mon2mat;
	    mon2.parent = camera;
	    // mon2.parent = camera;
	    mon2.layerMask = 1;

	    mon2.enableEdgesRendering(epsilon);	
	    mon2.edgesWidth = 5.0;
	    mon2.edgesColor = new BABYLON.Color4(1, 1, 1, 1);

      */

      // create gui 
      var claraGUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "UI",
        true,
        this.scene
      );

      // create and setup camera button stack
      var cameraPanel = new GUI.StackPanel();
      cameraPanel.isVertical = false;
      cameraPanel.height = "100px";
      cameraPanel.width = "185px";
      cameraPanel.paddingRight = "10px"
      cameraPanel.paddingTop = "10px"
      cameraPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      cameraPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // create and setup detail options stack
      var optionsPanel = new GUI.StackPanel();
      optionsPanel.isVertical = false;
      optionsPanel.width = "220px";
      optionsPanel.height = "70px";
      optionsPanel.paddingLeft = "10px"
      optionsPanel.paddingTop = "10px"
      optionsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      optionsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // create and setup speed settings stack
      var speedPanel = new GUI.StackPanel();
      speedPanel.isVertical = false;
      speedPanel.width = "220px";
      speedPanel.height = "70px";
      speedPanel.paddingLeft = "10px"
      speedPanel.paddingTop = "10px"
      speedPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      speedPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      
      // add stacks to gui
      claraGUI.addControl(cameraPanel);
      claraGUI.addControl(optionsPanel);
      claraGUI.addControl(speedPanel);

      // creates text above detail options
      let detailHeading = new GUI.TextBlock();
      detailHeading.text = "Detail";
      detailHeading.height = "30px";
      detailHeading.width = "130px";
      detailHeading.color = "black";
      detailHeading.fontSize = "20";
      detailHeading.fontWeight = "bold";
      detailHeading.paddingLeft = "20px";
      detailHeading.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      detailHeading.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // creates text above camera buttons
      let cameraHeading = new GUI.TextBlock();
      cameraHeading.text = "Camera Options";
      cameraHeading.height = "30px";
      cameraHeading.width = "180px";
      cameraHeading.color = "black";
      cameraHeading.fontSize = "20";
      cameraHeading.fontWeight = "bold";
      cameraHeading.paddingRight = "20px";
      cameraHeading.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      cameraHeading.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // adds headings to gui
      claraGUI.addControl(detailHeading);
      claraGUI.addControl(cameraHeading);

      // create camera angle buttons
      //    - cam1 = angle 1 (higher)
      //    - cam2 = angle 2 (lower)
      //    - cam3 = angle 3 (limited-free range) - NEEDS TO BE IMPLEMENTED

      // create and setup cam1 button
      var cam1 = GUI.Button.CreateImageOnlyButton("cam1", "/top-down.png");
      cam1.width = "60px";
      cam1.height = "50px";
      cam1.color = "transparent";
      cam1.paddingRight = "10px";
      cam1.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.upperBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });

      // create and setup cam2 button
      var cam2 = GUI.Button.CreateImageOnlyButton("cam2", "/side-view.png");
      cam2.width = "60px";
      cam2.height = "50px";
      cam2.color = "transparent";
      cam2.paddingRight = "10px";
      cam2.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = Math.PI / 2;
        camera.upperBetaLimit = Math.PI / 3;
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });

      // create and setup cam3 button
      var cam3 = GUI.Button.CreateImageOnlyButton("cam3", "/free-view.png");
      cam3.width = "60px";
      cam3.height = "50px";
      cam3.color = "transparent";
      cam3.paddingRight = "10px";
      cam3.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = 0;
        camera.upperBetaLimit = 0;
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = 0;
      });
      
      // add buttons to camera stack
      cameraPanel.addControl(cam1);
      cameraPanel.addControl(cam2);
      cameraPanel.addControl(cam3);

      // create detail text 
      let detail = new GUI.TextBlock();
      if (globalThis.detailLevel == 1) {
        detail.text = "Low";
      }
      else if (globalThis.detailLevel == 2) {
        detail.text = "Medium";
      }
      else {
        detail.text = "High";
      }
      detail.height = "20px";
      detail.width = "80px";
      detail.color = "black";

      // create and setup decrease detail button
      let lowerDetailBtn = GUI.Button.CreateImageOnlyButton("lower", "/lower.png");
      lowerDetailBtn.height = "25px";
      lowerDetailBtn.width = "25px";
      lowerDetailBtn.onPointerClickObservable.add(function () {
        if (globalThis.detailLevel == 1) {
          console.log("can't go lower");
        }
        else if (globalThis.detailLevel == 2) {
          globalThis.detailLevel = 1;
          detail.text = "Low";
        }
        else {
          globalThis.detailLevel = 2;
          detail.text = "Medium";
        }
      });

      // create and setup increase detail button
      let higherDetailBtn = GUI.Button.CreateImageOnlyButton("higher", "/higher.png");
      higherDetailBtn.height = "25px";
      higherDetailBtn.width = "25px";
      higherDetailBtn.onPointerClickObservable.add(function () {
        if (globalThis.detailLevel == 1) {
          globalThis.detailLevel = 2;
          detail.text = "Medium";
        }
        else if (globalThis.detailLevel == 2) {
          globalThis.detailLevel = 3;
          detail.text = "High";
        }
        else {
          console.log("can't go higher");
        }
      });

      // create and setup reload button
      var reloadBtn = GUI.Button.CreateImageOnlyButton("reload", "/reload.png");
      reloadBtn.height = "25px";
      reloadBtn.width = "35px";
      reloadBtn.paddingLeft = "10px";
      reloadBtn.onPointerClickObservable.add(async () => {
        console.log("Scene is now reloading...");

        this.scene.dispose();
        var newScene = createScene(globalThis.detailLevel);
        this.assetsManager = new BABYLON.AssetsManager(newScene);
        await preloadMeshes(this.assetsManager);
        engine.runRenderLoop(function () {
          newScene.render();
        });
        this.loadScene(this.glbDef);
        
        console.log("Scene has reloaded!");
      });

      // add options to panel
      optionsPanel.addControl(lowerDetailBtn);
      optionsPanel.addControl(detail);
      optionsPanel.addControl(higherDetailBtn);
      optionsPanel.addControl(reloadBtn);

      // create and setup double speed button
      let doubleSpeedButton = GUI.Button.CreateSimpleButton("DoubleSpeed", "DoubleSpeed");
      doubleSpeedButton.width = 0.2;
      doubleSpeedButton.height = "40px";
      doubleSpeedButton.color = "white";
      doubleSpeedButton.background = "green";
      doubleSpeedButton.width = "150px";
      doubleSpeedButton.onPointerClickObservable.add(async () => {
        //increase speed of scene, currently 3 settings, just use first array value of each required section
        let x = 0;
        console.log("death speed before:" + this.currentDeathSpeed);
        this.currentDeathSpeed = this.deathSpeed[x];
        console.log("death speed now:" + this.currentDeathSpeed);

        this.currentTurnSpeed = this.turnSpeed[x];
        this.currentFrameSpeed = this.framesSpeed[x];
        this.currentMoveWaitSpeed = this.moveWaitSpeed[x];
      });
      
      // create and setup half speed button
      let halfSpeedButton = GUI.Button.CreateSimpleButton("NormalSpeed", "NormalSpeed");
      halfSpeedButton.width = 0.2;
      halfSpeedButton.height = "40px";
      halfSpeedButton.color = "white";
      halfSpeedButton.background = "green";
      halfSpeedButton.width = "150px";
      halfSpeedButton.onPointerClickObservable.add(async () => {
        //increase speed of scene, currently 3 settings, just use first array value of each required section
        let x = 1;
        console.log("death speed before:" + this.currentDeathSpeed);
        this.currentDeathSpeed = this.deathSpeed[x];
        console.log("death speed now:" + this.currentDeathSpeed);
        this.currentTurnSpeed = this.turnSpeed[x];
        this.currentFrameSpeed = this.framesSpeed[x];
        this.currentMoveWaitSpeed = this.moveWaitSpeed[x];
      });
     
      // create and setup normal speed button
      let normalSpeedButton = GUI.Button.CreateSimpleButton("HalfSpeed", "HalfSpeed");
      normalSpeedButton.width = 0.2;
      normalSpeedButton.height = "40px";
      normalSpeedButton.color = "white";
      normalSpeedButton.background = "green";
      normalSpeedButton.width = "150px";
      normalSpeedButton.onPointerClickObservable.add(async () => {
        //increase speed of scene, currently 3 settings, just use first array value of each required section
        let x = 2;
        console.log("death speed before:" + this.currentDeathSpeed);
        this.currentDeathSpeed = this.deathSpeed[x];
        console.log("death speed now:" + this.currentDeathSpeed);
        this.currentTurnSpeed = this.turnSpeed[x];
        this.currentFrameSpeed = this.framesSpeed[x];
        this.currentMoveWaitSpeed = this.moveWaitSpeed[x];
      });
      
      // create and setup super fast speed button
      let bigSpeedButton = GUI.Button.CreateSimpleButton("BigSpeed", "BigSpeed");
      bigSpeedButton.width = 0.2;
      bigSpeedButton.height = "40px";
      bigSpeedButton.color = "white";
      bigSpeedButton.background = "green";
      bigSpeedButton.width = "150px";
      bigSpeedButton.onPointerClickObservable.add(async () => {
        //increase speed of scene, currently 3 settings, just use first array value of each required section
        let x = 3;
        console.log("death speed before:" + this.currentDeathSpeed);
        this.currentDeathSpeed = this.deathSpeed[x];
        console.log("death speed now:" + this.currentDeathSpeed);
        this.currentTurnSpeed = this.turnSpeed[x];
        this.currentFrameSpeed = this.framesSpeed[x];
        this.currentMoveWaitSpeed = this.moveWaitSpeed[x];
      });

      // add speed option buttons to speed panel
      speedPanel.addControl(doubleSpeedButton);
      speedPanel.addControl(halfSpeedButton);
      speedPanel.addControl(normalSpeedButton);
      speedPanel.addControl(bigSpeedButton);

      // create light
      let light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
        scene
      );
      this.light = light;

      // setup keyboard input handling
      var inputMap = {};
      scene.actionManager = new BABYLON.ActionManager(scene);
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }));
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }));

      var animating = true;

      scene.onBeforeRenderObservable.add(() => {
        var keydown = false;
       
        //Manage the movements of the character (e.g. position, direction)
        if (inputMap["w"] || inputMap["W"]) {
          this.claraMoveForwardFunction();
            
            keydown = true;
        }
        if (inputMap["s"]) { //if clara wants to move backwards
          
          keydown = true;
        }
        if (inputMap["a"]) {
          
            keydown = true;
        }
        if (inputMap["d"]) {
          if(this.alive){
            this.claraTurnRightFunction();
          }
          
            keydown = true;
        }
        if (inputMap["b"]) {          

            keydown = true;
        }

         //Manage animations to be played  
         if (keydown) {
          if (!animating) {
              animating = true;
              if (inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]) {
                  //Walk backwards
                  this.playerAnimator.start(true, 1, 60, 160);
              }
          }
        }
      });

      // USED FOR MINIMAP, CURRENTLY WIP
      // scene.registerBeforeRender(function () {
      //   camera2.alpha = camera.alpha;
      // });

      // enable depth renderering and return scene
      scene.enableDepthRenderer();
      return scene;
    };

    // screen resizing
    window.addEventListener("resize", function () {
      engine.resize();
    });
    
    // assign default detail level
    this.detailLevel = 3;

    // create scene
    var scene = createScene(this.detailLevel);
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

    // assign global definition
    this.glbDef = definition;

    // this.camera.target = new BABYLON.Vector3(11, -2, 13.5);

    //this.camera.target.x = 11;
    this.camera.target.x = rows;
    this.camera.target.y = (rows - columns);
    this.camera.target.z = columns;

    // create board loop
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      // initializing movementGrid
      this.movementGrid[rowIndex] = [];
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        // filling movementGrid
        this.movementGrid[rowIndex][columnIndex] = 0;

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
            this.getTree(rowIndex * 2.1, 1.6, columnIndex * 2.1);
            this.movementGrid[rowIndex][columnIndex] = 1;
          }
          // tid == 2, place water
          else if (existingTile.tid == 2) {
            let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0.9,
              columnIndex * 2.1
            );
            top.scaling = new BABYLON.Vector3(1.2, 1, 1.2);
            let gap = 2.1;

            if (this.detailLevel != 1) {
              let waterParticles = new BABYLON.ParticleSystem("particles", 1000, this.scene);
              waterParticles.particleTexture = new BABYLON.Texture("spray.png"); 
              waterParticles.emitter = new BABYLON.Vector3(
                rowIndex * 2.1,
                0,                                                                
                columnIndex * 2.1
            );
            waterParticles.start();
            
            /*
               if tile on edge, put waterfall
            */
               if(rowIndex == 0){
                let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                top.position = new BABYLON.Vector3((rowIndex * 2.1)-1.15, -0.1, columnIndex * 2.1);
                top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                top.rotation = new BABYLON.Vector3 (0,0,Math.PI/2)
                let gap = 2.1
                var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
  
                particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
  
                particleSys.emitter = new BABYLON.Vector3((rowIndex * 2.1)-1.15, -0.1, columnIndex * 2.1);
                particleSys.start();
                for(let i = 0;i<5;i++){
                let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                top.position = new BABYLON.Vector3((rowIndex * 2.1)-1.15, (-0.1)-gap, columnIndex * 2.1);
                top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                top.rotation = new BABYLON.Vector3 (0,0,Math.PI/2);
                var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
  
                particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
  
                particleSys.emitter = new BABYLON.Vector3((rowIndex * 2.1)-1.15, (-0.1)-gap, columnIndex * 2.1);
                particleSys.start();
                gap+=2.1;
                }
              }
  
               if(rowIndex == rows-1){
                let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                top.position = new BABYLON.Vector3((rowIndex * 2.1)+1.15, -0.1, columnIndex * 2.1);
                top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                top.rotation = new BABYLON.Vector3 (0,Math.PI,Math.PI/2)
  
                gap = 2.1
  
                var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                particleSys.emitter = new BABYLON.Vector3((rowIndex * 2.1)+1.15, -0.1, columnIndex * 2.1);
                particleSys.start();
  
                for(let i = 0;i<5;i++){
                  
                  let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                  top.position = new BABYLON.Vector3((rowIndex * 2.1)+1.15, (-0.1)-gap, columnIndex * 2.1);
                  top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                  top.rotation = new BABYLON.Vector3 (0,Math.PI,Math.PI/2)
  
                  var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                  particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                  particleSys.emitter = new BABYLON.Vector3((rowIndex * 2.1)+1.15, (-0.1)-gap, columnIndex * 2.1);
                  particleSys.start();
  
                  gap+=2.1;
                }
  
              }
  
               if(columnIndex == 0){
                let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                top.position = new BABYLON.Vector3(rowIndex * 2.1, -0.1, (columnIndex * 2.1)-1.15);
                top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                top.rotation = new BABYLON.Vector3 (Math.PI/2,Math.PI,0)
                gap = 2.1
  
                var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                particleSys.emitter = new BABYLON.Vector3(rowIndex * 2.1, -0.1, (columnIndex * 2.1)-1.15);
                particleSys.start();
  
                for(let i=0;i<5;i++){
                  let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                  top.position = new BABYLON.Vector3(rowIndex * 2.1, (-0.1)-gap, (columnIndex * 2.1)-1.15);
                  top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                  top.rotation = new BABYLON.Vector3 (Math.PI/2,Math.PI,0)
                  
                  var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                  particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                  particleSys.emitter = new BABYLON.Vector3(rowIndex * 2.1, (-0.1)-gap, (columnIndex * 2.1)-1.15);
                  particleSys.start();
                  gap+=2.1;
  
                }
  
              }
  
              if(columnIndex == columns-1){
                let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                top.position = new BABYLON.Vector3(rowIndex * 2.1, -0.1, (columnIndex * 2.1)+1.15);
                top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                top.rotation = new BABYLON.Vector3 (Math.PI/2,0,0)
                
                var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                particleSys.emitter = new BABYLON.Vector3(rowIndex * 2.1, -0.1, (columnIndex * 2.1)+1.15);
                particleSys.start();
  
                gap = 2.1;
  
                for(let i=0;i<5;i++){
  
                  let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
                  top.position = new BABYLON.Vector3(rowIndex * 2.1, (-0.1)-gap, (columnIndex * 2.1)+1.15);
                  top.scaling = new BABYLON.Vector3(1.2,1,1.2);
                  top.rotation = new BABYLON.Vector3 (Math.PI/2,0,0)
                  
                  var particleSys = new BABYLON.ParticleSystem("particles", 1000, this.scene); //creates the particle system
                  particleSys.particleTexture = new BABYLON.Texture("spray.png"); //texture of each particle
                  particleSys.emitter = new BABYLON.Vector3(rowIndex * 2.1, (-0.1)-gap, (columnIndex * 2.1)+1.15);
                  particleSys.start();
  
                  gap+=2.1
  
                }
  
              }
  
              }
            this.movementGrid[rowIndex][columnIndex] = 2;
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
                
                BABYLON.SceneLoader.ImportMesh(
                  "",
                  "./",
                  "Clara.glb",
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
                    this.clara = meshes[0];
                    this.initialiseClara();

                    this.playerAnimator = ags[0];
                    this.playerAnimator.stop();

                    //var skeleton = skeletons[0];
                    //sc.stopAnimation(skeleton);
                    //sc.beginAnimation(skeleton, 0, 29, true, 2.0);
                  }
                );
                this.startPosition = new BABYLON.Vector3(rowIndex*2.1, 1, columnIndex *2.1);            // assign clara's starting positioning for resets
                //console.log("tile ", this.clara.position);
                this.directionFacing = existingTile.d;        // assign clara's current direction
                this.movementGrid[rowIndex][columnIndex] = 4; // assign clara in movement grid
                this.claraXCoord = rowIndex;      // log clara's current x coord in grid
                this.claraYCoord = columnIndex;   // log clara's current y coord in grid
                break;
              }
              case 5: {
                // leaf

                this.movementGrid[rowIndex][columnIndex] = 5;
                const box = BABYLON.MeshBuilder.CreateBox("box", {height: 1, width: 0.75, depth: 0.25});
                box.position = new BABYLON.Vector3(rowIndex*2.1, 1.5, columnIndex*2.1);

                this.movementGrid[rowIndex][columnIndex] = 5;
                break;
              }
              case 6: {
                // mushroom

                this.movementGrid[rowIndex][columnIndex] = 6;
                 let item = "Mushrooms1";
                 let top = Atlas.mushrooms.get(item +".glb").createInstance("");
                 top.position = new BABYLON.Vector3(rowIndex*2.1, 1.5, columnIndex*2.1);
                 top.scaling = new BABYLON.Vector3(4,4,4);
                this.movementGrid[rowIndex][columnIndex] = 6;
                break;
              }
              case 7: {
                // ghost
                this.movementGrid[rowIndex][columnIndex] = 7;
                break;
              }
              case 8: {
                // ghostWall
                this.movementGrid[rowIndex][columnIndex] = 8;
                break;
              }
              case 9: {
                // ghostHealer
                this.movementGrid[rowIndex][columnIndex] = 9;
                break;
              }
              case 10: {
                // home
                this.movementGrid[rowIndex][columnIndex] = 10;
                break;
              }
              case 11: {
                // dot
                this.movementGrid[rowIndex][columnIndex] = 11;
                break;
              }
              case 12: {
                // earth
                this.movementGrid[rowIndex][columnIndex] = 12;
                break;
              }
              case 13: {
                // gold
                this.movementGrid[rowIndex][columnIndex] = 13;
                break;
              }
              case 14: {
                // brokenGold
                this.movementGrid[rowIndex][columnIndex] = 14;
                break;
              }
              case 15: {
                // pheromone
                this.movementGrid[rowIndex][columnIndex] = 15;
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
        
        if (existingTile != null && existingTile.tid == 2) {
          if (globalThis.detailLevel == 3) {
            this.chooseItem(rowIndex * 2.1, 1, columnIndex * 2.1, true);
          }
          else if (globalThis.detailLevel == 2) {
            if ((Math.floor(Math.random() * 10)) + 1 < 5) {
            this.chooseItem(rowIndex * 2.1, 1, columnIndex * 2.1, true);
            }
          }
        }
        else {
          if (this.detailLevel == 3) {
            this.chooseItem(rowIndex * 2.1, 1, columnIndex * 2.1, false);
          }
          else if (this.detailLevel == 2) {
            if ((Math.floor(Math.random() * 10)) + 1 < 5) {
              this.chooseItem(rowIndex * 2.1, 1, columnIndex * 2.1, false);
            }
          }
        }
        
      }
    }

    /* 
        NEED TO GET BOTTOM OF ISLAND SCALING 
        - below works except on long islands
        - island is 4.5 tiles x 4.5 tiles
    */ 
    BABYLON.SceneLoader.ImportMesh("", "./", "island.glb", this.scene, function (meshes) {
      meshes.forEach((mesh) => {
        if (mesh.material) {
          mesh.material.needDepthPrePass = true;
        }
      });
      let root = meshes[0];
      let islandX = (rows * 2.1 - 2.1) / 2;
      let islandY = (columns * 2.1 - 2.1) / 2;
      root.position = new BABYLON.Vector3(islandX, 1.5, islandY);
      root.scaling = new BABYLON.Vector3(rows / 4.5, 1.8, columns / 4.5);
    });


    // create and set up control stack
    // var controlPanel = new GUI.StackPanel();
    // controlPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    // controlPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    // this.glbGUI.addControl(controlPanel);

    // let wBTN = GUI.Button.CreateSimpleButton("Move", "W");
    // wBTN.width = "50px";
    // wBTN.height = "50px";
    // wBTN.color = "white";
    // wBTN.background = "grey";
    // wBTN.onPointerClickObservable.add(() => {
    //   setTimeout(async () => {
    //     this.claraMoveForwardFunction();
    //   });
    // });

    // controlPanel.addControl(wBTN);

    // let turnRight = GUI.Button.CreateImageOnlyButton("turnRight", "/higher.png");
    // turnRight.height = "50px";
    // turnRight.width = "50px";
    // turnRight.onPointerClickObservable.add(() => {
    //   this.claraTurnRightFunction();
    // });

    // controlPanel.addControl(turnRight);
    
    this.createDistantIsland(25,1,25);
    this.createDistantIsland(25,1,50);
    this.createDistantIsland(-50,1,-25);
    this.createDistantIsland(50,1,-25);
  }

  // function to generate random tree
  // tree preferences:
  //    - Group 1: Tree1 - Tree7 (<50KB)
  //    - Group 2: Tree1 - Tree12 (<80KB)
  //    - Group 3: Tree1 - Tree15 (<200KB)
  getTree(xcoord: number, ycoord: number, zcoord: number) {
    let tree = "Tree";

    if (this.detailLevel == 1) {
      tree += Math.floor(Math.random() * 7) + 1;
    } else if (this.detailLevel == 2) {
      tree += Math.floor(Math.random() * 12) + 1;
    } else if (this.detailLevel == 3) {
      tree += Math.floor(Math.random() * 15) + 1;
    }

    let mesh = Atlas.trees.get(tree + ".glb").createInstance("");
    mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
    mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
  }

  // function to get decorative item
  // tall grasses:
  //    - Group 1: TallGrass1 (<=36KB)
  //    - Group 2: TallGrass1 - TallGrass4 (<=37KB)
  //    - Group 3: TallGrass1 - TallGrass5 (<=38KB)
  //
  // grass sets:
  //    - Group 1: GrassSet1 (<90KB)
  //    - Group 2: GrassSet1 - GrassSet3 (<130KB)
  //    - Group 3: GrassSet1 - GrassSet5 (<150KB)
  //
  // mushrooms:
  //    - Group 1: Mushrooms1 - Mushrooms2 (<40KB)
  //    - Group 2: Mushrooms1 - Mushrooms3 (<50KB)
  //    - Group 3: Mushrooms1 - Mushrooms4 (<60KB)
  chooseItem(xcoord: number, ycoord: number, zcoord: number, waterTile: boolean) {
    let item = "";
    
    let choice;
    if (waterTile) {
      choice = 3;
    }
    else {
      choice = Math.floor(Math.random() * 3);
    }

    xcoord += (Math.random() * 1);
    zcoord += (Math.random() * 1);

    // switch to pick item
    switch (choice) {
      // case 0 = GrassSet
      case 0: {
        item = "GrassSet";
        if (this.detailLevel == 1) {
          item += Math.floor(Math.random() * 1) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 2) {
          item += Math.floor(Math.random() * 4) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 3) {
          item += Math.floor(Math.random() * 5) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        break;
      }
      // case 1 = TallGrass
      case 1: {
        item = "TallGrass";
        if (this.detailLevel == 1) {
          item += Math.floor(Math.random() * 1) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 2) {
          item += Math.floor(Math.random() * 3) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 3) {
          item += Math.floor(Math.random() * 5) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        break;
      }
      // case 2 = Stones
      case 2: {
        item = "Stones" + (Math.floor(Math.random() * 2) + 1);
        let mesh = Atlas.stones.get(item + ".glb").createInstance("");
        mesh.position = new BABYLON.Vector3(xcoord, ycoord, zcoord);
        mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        break;
      }
      // case 3 = Mushrooms
      case 3: {
        /*
          NOT SURE IF WE SHOULD INCLUDE MUSHROOMS IF CLIENT WANTS TO USE THESE FOR MUSHROOM ITEMS
        */
        // item = "Mushrooms";
        // if (this.detailLevel == 1) {
        //   item += Math.floor(Math.random() * 2) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.3, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        // else if (this.detailLevel == 2) {
        //   item += Math.floor(Math.random() * 3) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.5, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        // else if (this.detailLevel == 3) {
        //   item += Math.floor(Math.random() * 4) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.5, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        break;
      }
      default: {
        break;
      }
    }
  } 

  checkMove() {
    switch (this.directionFacing) {
      //checking 1/2 is checking for water or trees
      case 0: {
        if (this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 1
          || this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 2) {            
            this.playClaraDeathAnimation();
            this.alive = false;
           return false;
         }
         //check 5 for leaf
         if(this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 5){
          this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
          this.movementGrid[this.claraXCoord-1][this.claraYCoord] = 4;
          this.leavesCollected +=1;
          this.claraXCoord -= 1;
           this.castRayLeaf();
           return true;
          
           
         }
         //check 6 is for mushroom
         if(this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 6){
           if(this.checkMushroomMove()){
            this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
            this.movementGrid[this.claraXCoord-1][this.claraYCoord] = 4;
            this.claraXCoord -= 1;
            this.castRayMushroom(-1, 0);
             return true;
           }
           else{
             return false;
           }
         }
         this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         this.movementGrid[this.claraXCoord-1][this.claraYCoord] = 4;
         this.claraXCoord -= 1;
         return true;
      }
      case 1: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 1
          || this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 2) {
            
            this.playClaraDeathAnimation();
            this.alive = false;
           return false;
         }
         //check 5 for leaf
         if(this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 5){
          this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
          this.movementGrid[this.claraXCoord][this.claraYCoord+1] = 4;
          this.leavesCollected +=1;
          this.claraYCoord += 1;
          this.castRayLeaf();
          return true;
          
        }
        //check 6 is for mushroom
        if(this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 6){
          if(this.checkMushroomMove()){
            this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
            this.movementGrid[this.claraXCoord][this.claraYCoord+1] = 4;
            this.claraYCoord += 1;
            this.castRayMushroom(0,1);
            return true;
          }
          else{
            return false;
          }
        }
        this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         this.movementGrid[this.claraXCoord][this.claraYCoord+1] = 4;
         this.claraYCoord += 1;
         return true;
      }
      case 2: {
        if (this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 1
          || this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 2) {
            
            this.playClaraDeathAnimation();
            this.alive = false;
           return false;
         }
         //check 5 for leaf
         if(this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 5){
          this.castRayLeaf();
          this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
          this.movementGrid[this.claraXCoord+1][this.claraYCoord] = 4;
          this.leavesCollected +=1;
          this.claraXCoord += 1;
          return true;
        }
        //check 6 is for mushroom
        if(this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 6){
          if(this.checkMushroomMove()){
            this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
            this.movementGrid[this.claraXCoord+1][this.claraYCoord] = 4;
            this.claraXCoord += 1;
            this.castRayMushroom(1,0);
            return true;
          }
          else{
            return false;
          }
        }
        this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         this.movementGrid[this.claraXCoord+1][this.claraYCoord] = 4;
         this.claraXCoord += 1;
         return true;
      }
      case 3: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 1
          || this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 2) {
            
            this.playClaraDeathAnimation();
            this.alive = false;
           return false;
         }
         //check 5 for leaf
         if(this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 5){
          this.castRayLeaf();
          this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
          this.movementGrid[this.claraXCoord][this.claraYCoord-1] = 4;
          this.leavesCollected +=1;
          this.claraYCoord -= 1;
          return true;
        }
        //check 6 is for mushroom
        if(this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 6){
          if(this.checkMushroomMove()){
            this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
            this.movementGrid[this.claraXCoord][this.claraYCoord-1] = 4;
            this.claraYCoord -= 1;
            this.castRayMushroom(0,-1);
            return true;
          }
          else{
            return false;
          }
        }
        this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         this.movementGrid[this.claraXCoord][this.claraYCoord-1] = 4;
         this.claraYCoord -= 1;
         return true;
      }
      default: {
        break;
      }
    }
  }

  checkMushroomMove(){
    switch (this.directionFacing) {
      case 0: {
        //check if ahead of mushroom is a tree or water
        if (this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 1 ||
           this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 2  ||
           this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 5  ||
           this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 6) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord-2][this.claraYCoord]);
           return false;
         }
         //if true, update grid position of the mushroom and clara, then update clara x/y position
        //  this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
        //  this.movementGrid[this.claraXCoord-1][this.claraYCoord] = 4;
         this.movementGrid[this.claraXCoord-2][this.claraYCoord] = 6;
         //this.claraXCoord -= 1;
         //this.claraXCoord -= 1;
         return true;
      }
      case 1: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 1 ||
           this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 2  ||
           this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 5  ||
           this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 6) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord][this.claraYCoord+2]);
           return false;
         }
         //this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         //this.movementGrid[this.claraXCoord][this.claraYCoord+1] = 4;
         this.movementGrid[this.claraXCoord][this.claraYCoord+2] = 6;
         //this.claraYCoord += 1;
         //this.claraYCoord += 1;
         return true;
      }
      case 2: {
        if (this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 1 ||
           this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 2  ||
           this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 5  ||
           this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 6) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord+2][this.claraYCoord]);
           return false;
         }
         //this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         //this.movementGrid[this.claraXCoord+1][this.claraYCoord] = 4;
         this.movementGrid[this.claraXCoord+2][this.claraYCoord] = 6;
         //this.claraXCoord += 1;
         //this.claraXCoord += 1;
         return true;
      }
      case 3: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 1 ||
           this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 2  ||
           this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 5  ||
           this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 6) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord][this.claraYCoord-2]);
           return false;
         }
         //this.movementGrid[this.claraXCoord][this.claraYCoord] = 0;
         //this.movementGrid[this.claraXCoord][this.claraYCoord-1] = 4;
         this.movementGrid[this.claraXCoord][this.claraYCoord-2] = 6;
         //this.claraYCoord -= 1;
         //this.claraYCoord -= 1;
         return true;
      }
      default: {
        break;
      }
    }
  }

  initialiseClara() {
    if(this.directionFacing == 0){
      console.log("Clara starting direction: " + this.directionFacing);
      this.clara.rotate(BABYLON.Vector3.Up(), -1.5708); //turn clara left
      console.log("Clara starting direction: " + this.directionFacing);
    } else if(this.directionFacing == 2){
      this.clara.rotate(BABYLON.Vector3.Up(), 1.5708);  //turn clara right
    } else if(this.directionFacing == 3){
      this.clara.rotate(BABYLON.Vector3.Up(), 3.1416);  //turn clara around
    }
  }

  async customAnimationFunctionClara(nextPosition){
    console.log("current framespeed: " + this.currentFrameSpeed); 
     setTimeout(async () => {
       var anim =  BABYLON.Animation.CreateAndStartAnimation("anim", 
                   this.clara, 
                   "position", 
                   this.currentFrameSpeed, 
                   60, 
                   this.currentPosition,
                   nextPosition,
                   //new BABYLON.Vector3(this.currentPosition._x-2.1, this.currentPosition._y, this.currentPosition._z), 
                   BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE); 
 
       //this.playerAnimator.stop();
       //this.playerAnimator.start(true, 1, 60, 160); //walk
       this.playClaraWalkAnimation();
      // this.playClaraTurnRightAnimation();
       await anim.waitAsync();
       this.playClaraIdleAnimation();
       //this.playerAnimator.stop();
       //this.playerAnimator.start(true, 1, 0, 58); //idle
     });
   }

   claraTurnRightFunction(){
    if(!this.justMoved){
      this.justMoved = true;
      setTimeout(() => this.justMoved = false, this.currentTurnSpeed);

      // setTimeout(async () => {

      //   var anim = this.scene.beginAnimation(this.clara, 120, 156, true);

      //   this.playClaraWalkAnimation();

      //   await anim.waitAsync();

      //   this.playClaraIdleAnimation();

      // });



      this.clara.rotate(BABYLON.Vector3.Up(), 1.5708);

      this.playClaraIdleAnimation();

      if (this.directionFacing != 3) {
        this.directionFacing++;
      }
      else {
        this.directionFacing = 0;
      }
      console.log("facing = ", this.directionFacing);
    }
    else{
      console.log("yo just wait");
    }

  }

  claraMoveForwardFunction() {
    console.log(this.movementGrid);
    console.log("before move: " +this.movementGrid);
    if(!this.justMoved && this.alive){
      if (this.checkMove() ) {
        console.log("after move: " +this.movementGrid);

    //this.currentPosition = this.clara.position;
    this.justMoved = true;
    this.currentPosition = this.clara.position;
    setTimeout(() => this.justMoved = false, this.currentMoveWaitSpeed); //after 1 second, becomes, false, allows the code to continue, prevents button/keys being spammed

    console.log(this.currentPosition);

    var nextPosition;
    switch(this.directionFacing) {
      case 0: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x-2.1, this.currentPosition._y, this.currentPosition._z);

        //this.clara.movePOV(0,0,-2.1);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 1: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x, this.currentPosition._y, this.currentPosition._z+2.1);
        //this.clara.movePOV(2.1,0,0);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 2: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x+2.1, this.currentPosition._y, this.currentPosition._z);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 3: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x, this.currentPosition._y, this.currentPosition._z-2.1);
      // this.clara.movePOV(0,0,-2.1);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      default: {
        break;
      }
    }
      var anim =  this.customAnimationFunctionClara(nextPosition);
    }
    else {
      console.log("current postion is: " + this.currentPosition);
      console.log("invalid move!!!");
    }
    }
    else{
      console.log("yo can u just wait??");
    }
  }

  playClaraIdleAnimation(){
    this.playerAnimator.stop();
      this.playerAnimator.start(true, 1, 0, 60); //idle
  }
  playClaraWalkAnimation(){
    this.playerAnimator.stop();
      this.playerAnimator.start(true, 1, 60, 156); //walk
  }
playClaraDeathAnimation = async() =>{
    console.log("about to wait " + this.currentDeathSpeed + " milli-seconds");
    this.playerAnimator.stop();
    this.playerAnimator.start(true, 1, 320, 366); //death
    await delay(this.currentDeathSpeed);
    console.log("waited " + this.currentDeathSpeed + " milli-seconds");

    //attempting to make her stop at the upside-down position
    this.playerAnimator.stop();
    this.playerAnimator.start(true, 1, 360, 366); //death
  }

  animateRandomMesh(randoMesh: BABYLON.AbstractMesh, x:number, z:number){
    var anim =  BABYLON.Animation.CreateAndStartAnimation("anim", 
    randoMesh, 
    "position", 
    this.currentFrameSpeed, 
    60, 
    randoMesh.position,
    //nextPosition,
    new BABYLON.Vector3(randoMesh.position._x+x, randoMesh.position._y, randoMesh.position._z+z), 
    BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE); 
  }

  playClaraTurnRightAnimation(){
    this.playerAnimator.stop();
    //const animWheel = new BABYLON.Animation("anim", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    //this.scene.beginAnimation(this.clara, 120, 156, true);
    this.playerAnimator.start(true, 1, 240, 312); //turn right
  }
  playClaraTurnLeftAnimation(){
    this.playerAnimator.stop();
      this.playerAnimator.start(true, 1, 160, 232); //turn left
  }

  castRayMushroom(x:number, z:number) {
    x = x*2.1;
    z = z*2.1;
    //below works, but when want to move the origin of the ray, moves clara herself
   //var origin = this.clara.position;
   //below breaks movement
   //var origin = new BABYLON.Vector3(this.clara.position.x, this.clara.position.y+0.1, this.clara.position.z);
   var origin = this.clara.position;
   origin.y +=0.1;

   var forward = new BABYLON.Vector3(0,0,1);
   forward = this.vecToLocal(forward, this.clara);

   var direction = forward.subtract(origin);
   direction = BABYLON.Vector3.Normalize(direction);

   var length = 100;

   var ray = new BABYLON.Ray(origin, direction, length);

   //below just generates a line to show where the ray is casting
   // let rayHelper = new BABYLON.RayHelper(ray);
   // rayHelper.show(this.scene);

   var hit = this.scene.pickWithRay(ray);
   origin.y -= 0.1;

   if (hit.pickedMesh){
     //hit.pickedMesh.scaling.y += 0.5;
     this.animateRandomMesh(hit.pickedMesh, x, z);

   // hit.pickedMesh.scaling.y += 0.5;
  }
  }

  castRayLeaf(){
    var origin = this.clara.position;
    origin.y +=0.1; 

    var forward = new BABYLON.Vector3(0,0,1);
    forward = this.vecToLocal(forward, this.clara);

    var direction = forward.subtract(origin);
    direction = BABYLON.Vector3.Normalize(direction);

    var length = 100;

    var ray = new BABYLON.Ray(origin, direction, length);

    //below just generates a line to show where the ray is casting
    // let rayHelper = new BABYLON.RayHelper(ray);
    // rayHelper.show(this.scene);

    var hit = this.scene.pickWithRay(ray);
    origin.y -=0.1;

    if (hit.pickedMesh){
      setTimeout(async () => {
        var anim = this.animateLeaf(hit.pickedMesh);
        await anim;
        //hit.pickedMesh.dispose();
      });



      //hit.pickedMesh.scaling.y += 0.5;
      //now use the animation loaded into the mesh
    }

  }

  animateLeaf(randoMesh){
    var anim =  BABYLON.Animation.CreateAndStartAnimation("anim", 
    randoMesh, 
    "position", 
    this.currentFrameSpeed, 
    60, 
    randoMesh.position,
    //nextPosition,
    new BABYLON.Vector3(randoMesh.position._x, randoMesh.position._y+5, randoMesh.position._z), 
    BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE); 

  }

  vecToLocal(vector, mesh){
    var m = mesh.getWorldMatrix();
    var v = BABYLON.Vector3.TransformCoordinates(vector, m);
    return v;
  }


  // function to create a distant island
  createDistantIsland(x: number, y: number, z: number) {
    let iRows = Math.floor(Math.random() * (6 - 2)) + 2;  // rows of the island (min 2, max 6)
    let iCols = Math.floor(Math.random() * (6 - 2)) + 2;  // columns of the island (min 2, max 6)
    
    y = Math.floor(Math.random() * 10); // y coordinate randomised atm

    // island generation loop
    for (let iRowsIndex = 0; iRowsIndex < iRows; iRowsIndex++) {
      for (let iColsIndex = 0; iColsIndex < iCols; iColsIndex++) {
        // determines tile type (1 = dark grass, 2 = light grass, 3 = water)
        let tileType = Math.floor(Math.random() * 3) + 1;
        // if tile is water, place water
        if (tileType == 3) {
          let tile = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
          tile.position = new BABYLON.Vector3(
            (iRowsIndex * 2.1) + x,
            0.9 + y,
            (iColsIndex * 2.1) + z
          );
          console.log(0.9 * y);
          console.log(y + 0.9);
          tile.scaling = new BABYLON.Vector3(1.2, 1, 1.2);
        }
        // else place either dark or light grass
        else {
          let tile = Atlas.topTiles.get("GrassTop" + tileType + ".glb").createInstance("");
          tile.position = new BABYLON.Vector3((iRowsIndex * 2.1) + x, y, (iColsIndex * 2.1) + z);
        }
        // if dark grass, place tree
        if (tileType == 1) {
          this.getTree((iRowsIndex * 2.1) + x, 1.6 + y, (iColsIndex * 2.1) + z);
        }

        // if water tile, place water item
        if (tileType == 3) {
          if (globalThis.detailLevel == 3) {
            this.chooseItem((iRowsIndex * 2.1) + x, 1 + y, (iColsIndex * 2.1) + z, true);
          }
          else if (globalThis.detailLevel == 2) {
            if ((Math.floor(Math.random() * 10)) + 1 < 5) {
            this.chooseItem((iRowsIndex * 2.1) + x, 1 + y, (iColsIndex * 2.1) + z, true);
            }
          }
        }
        // if grass, place regular item
        else {
          if (this.detailLevel == 3) {
            this.chooseItem((iRowsIndex * 2.1) + x, 1 + y, (iColsIndex * 2.1) + z, false);
          }
          else if (this.detailLevel == 2) {
            if ((Math.floor(Math.random() * 10)) + 1 < 5) {
              this.chooseItem((iRowsIndex * 2.1) + x, 1 + y, (iColsIndex * 2.1) + z, false);
            }
          }
        }

      }
    }

    // place island bottom and scale
    BABYLON.SceneLoader.ImportMesh("", "./", "island.glb", this.scene, function (meshes) {
      meshes.forEach((mesh) => {
        if (mesh.material) {
          mesh.material.needDepthPrePass = true;
        }
      });
      let root = meshes[0];
      let islandX = (((iRows * 2.1) - 2.1) / 2) + x;
      let islandY = (((iCols * 2.1) - 2.1) / 2) + z;
      root.position = new BABYLON.Vector3(islandX, 1.5 + y, islandY);
      root.scaling = new BABYLON.Vector3(iRows / 4.5, 1.8, iCols / 4.5);
    });

  }

  createFog() {
    this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    this.scene.fogStart = 40.0
    this.scene.fogEnd = 60.0
    this.scene.fogColor = new BABYLON.Color3(0.8,0.8,0.8); 
  }
}