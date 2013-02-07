/*global window, document, MozActivity, alert, J3D, Image, localStorage,
  location, requestAnimationFrame */
var engine, scene;
var root, model, shader;
var mx = 0, my = 0;

var properties = {
  dispersionRed: 0.90,
  dispersionGreen: 0.97,
  dispersionBlue: 1.04,
  bias: 0.9,
  scale: 0.7,
  power: 1.1
};

var mapImages = {
  left: "models/textures/skybox/left.jpg",
  right: "models/textures/skybox/right.jpg",
  up: "models/textures/skybox/up.jpg",
  down: "models/textures/skybox/down.jpg",
  back: "models/textures/skybox/back.jpg",
  front: "models/textures/skybox/front.jpg"
};

function engineBoot() {
  engine = new J3D.Engine();

  J3D.Loader.loadGLSL("shaders/Glass.glsl", function(s) {
    shader = s;
  setup();
  });
}

function setup(){
  var camera = new J3D.Transform();
  camera.camera = new J3D.Camera({far: 100});
  camera.position.z = 5;
  engine.camera = camera;

  root = new J3D.Transform();
  root.add(camera);
  engine.scene.add(root);

  var cubemap = new J3D.Cubemap(mapImages);

  engine.scene.addSkybox(cubemap);

  shader.uCubemap = cubemap;

  var model = new J3D.Transform();
  model.rotation.x = 0.2;
  model.renderer = shader;
  J3D.Loader.loadJSON("models/skull.js", function(j) {
    model.geometry = new J3D.Mesh(j);
  });
  engine.scene.add(model);

  document.addEventListener('click', onClick, false);

  draw();

  // If we become hidden, then draw() stops requesting redraws.
  // So when we become visible again, start drawing again
  document.addEventListener('mozvisibilitychange', function vis() {
    if (!document.mozHidden)
      draw();
  });
}

function onClick(e) {
  mx = (e.clientX / window.innerWidth) * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
  if(isNaN(mx)) mx = 0;
  if(isNaN(my)) my = 0;
}

function draw() {
  // Keep redrawing while we're not hidden
  if (!document.mozHidden)
    requestAnimationFrame(draw);

  shader.chromaticDispertion = [
    properties.dispersionRed,
    properties.dispersionGreen,
    properties.dispersionBlue
  ];
  shader.bias = properties.bias;
  shader.scale = properties.scale;
  shader.power = properties.power;

  root.rotation.x += (my - root.rotation.x) / 20;
  root.rotation.y += mx * J3D.Time.deltaTime / 2000;

  engine.render();
}

window.onload = function(){

  document.getElementById('pickButton').addEventListener('click', function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var pick = new MozActivity({
      name: "pick",
      data: {
        type: ["image/png", "image/jpg", "image/jpeg"]
      }
    });

    pick.onsuccess = function () {
      var url = window.URL.createObjectURL(this.result.blob);

      var canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      var context = canvas.getContext('2d');
      var imageObj = new Image();

      imageObj.onload = function() {
        // draw cropped image
        var sourceX = 150;
        var sourceY = 0;
        var sourceWidth = 150;
        var sourceHeight = 150;
        var destWidth = sourceWidth;
        var destHeight = sourceHeight;
        var destX = canvas.width / 2 - destWidth / 2;
        var destY = canvas.height / 2 - destHeight / 2;

        //context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        context.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, 0, 0, 512, 512);

        url = canvas.toDataURL('image/jpeg');

        localStorage.setItem('storedUrl', url);
        location.reload();
      };
      imageObj.src = url;
    };

    pick.onerror = function (err) {
      alert("Can't view the image: " + err);
    };
  }, false);

  var url = localStorage.getItem('storedUrl');
  if (url) {
    ['left', 'right', 'up', 'down', 'back', 'front'].forEach(function (prop) {
      mapImages[prop] = url;
    });
  }
  engineBoot();
};

