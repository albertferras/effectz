var RAD = Math.PI/180.0;
var Sin = Math.sin;
var Cos = Math.cos;
var Sqrt = Math.sqrt;

// Notes on canvas rendering:
// There are 2 canvas: renderCanvas and targetCanvas:
// - renderCanvas: Used to draw plasma/other effects. Smaller than canvas shown in website.
// - targetCanvas: Canvas that is shown in website. The renderCanvas is scaled to fit in this canvas and drawn in a single drawImage call.


// ------ CONFIG-------------------
var ShowFPS = true;         // Show FPS of canvas render
var MIN_CANVAS_WIDTH_PX = 500;      // Minimum size of rendered canvas (scaled to fit window)
var MIN_CANVAS_HEIGHT_PX = 500;

var EFFECT_LIST = [{"name": "Plasma", "class": Plasma},
                   {"name": "Plasma2", "class": Plasma2},
                   {"name": "MouseBlend", "class": MouseBlend},
                   {"name": "RotNeedles", "class": RotNeedles},
                   {"name": "RotSquare", "class": RotSquare}];
var DEFAULT_EFFECT_IDX = 4;


// Global vars (computed)
var CANVAS_WIDTH_PX;
var CANVAS_HEIGHT_PX;
var MOUSE_POSITION_X = 0;
var MOUSE_POSITION_Y = 0;

var effect_selected;
var effectid2effect = {};

var g_plasma;
var g_framestart;
var time_cycles;

var targetCanvas;
var targetContext;

var e_fps;

window.addEventListener('load', onloadHandler, false);
window.addEventListener('resize', resizeHandler, false);

function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function effect_id(effect_idx) {
    return "effect" + effect_idx;
}

function mouse_select_effect(e) {
    new_effect_id = e.target.id;
    if (new_effect_id != effect_selected) {
        document.getElementById(effect_selected).className = "";
        document.getElementById(new_effect_id).className = "selected";
        change_effect(new_effect_id);
    }
}

/**
 * Global window onload handler
 */
function onloadHandler()
{
   // Show effect list
   e_effect_list = document.getElementById('efList').children[1];
   for (var i = 0; i < EFFECT_LIST.length; i++) {
       effect = EFFECT_LIST[i];
       var li = document.createElement("li");        // Create a <button> element
       li.id = effect_id(i);
       li.className = (i == DEFAULT_EFFECT_IDX) ? "selected" : "";
       li.addEventListener("click", mouse_select_effect);

       var t = document.createTextNode(effect["name"]);         // Create a text node
       li.appendChild(t);                                // Append the text to <button>
       e_effect_list.appendChild(li);                    // Append <button> to <body>

       effectid2effect[effect_id(i)] = effect;
   }
   effect_selected = effect_id(DEFAULT_EFFECT_IDX);


   // fullscreen the canvas element
   targetCanvas = document.getElementById('mycanvas');
   e_fps = document.getElementById('fps');

   // track mouse potition on canvas
   targetCanvas.addEventListener('mousemove', function(evt) {
      var rect = targetCanvas.getBoundingClientRect();
      MOUSE_POSITION_X = evt.clientX - rect.left;
      MOUSE_POSITION_Y = evt.clientY - rect.top;
   }, false);

   
   // Retrieving our target canvas, and context.
   targetContext = targetCanvas.getContext("2d");
   resizeHandler();
   
   // create the Plasma object
   change_effect(effect_selected);

   time_cycles = 0;
   
   // init the animation loop
   g_framestart = Date.now();
   requestAnimFrame(loop);
}

function change_effect(new_effect_id) {
    // clear current canvas
    targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // set new effect
    effect_selected = new_effect_id;
    effect = effectid2effect[effect_selected];
    if (g_plasma !== undefined)
        delete g_plasma;
    g_plasma = new effect["class"]();
    g_plasma.init();
}

function draw() {
   renderCanvas = g_plasma.render(time_cycles);
   
   ctx = targetCanvas.getContext("2d");
   ctx.save();
   // Scale between the render and target canvas sizes.
   ctx.scale(CANVAS_WIDTH_PX/renderCanvas.width,
             CANVAS_HEIGHT_PX/renderCanvas.height);
   // Draw render canvas onto the target canvas.
   ctx.drawImage(renderCanvas, 0, 0);
   ctx.restore();
}


/**
 * Global window resize handler
 */
function resizeHandler()
{
   if (targetCanvas)
   {
      canvas_div = document.getElementById('efCanvas');
      var cs = getComputedStyle(canvas_div);
      CANVAS_WIDTH_PX = parseInt(cs.getPropertyValue('width'), 10);

      canvas_div = document.getElementById('efMain');
      var cs = getComputedStyle(canvas_div);
      CANVAS_HEIGHT_PX = parseInt(cs.getPropertyValue('height'), 10);

      CANVAS_WIDTH_PX = Math.max(MIN_CANVAS_WIDTH_PX, CANVAS_WIDTH_PX);
      CANVAS_HEIGHT_PX = Math.max(MIN_CANVAS_HEIGHT_PX, CANVAS_HEIGHT_PX);

      // force 1:1 aspect ratio
      //CANVAS_HEIGHT_PX = CANVAS_WIDTH_PX = Math.min(CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX);

      targetCanvas.width = CANVAS_WIDTH_PX;
      targetCanvas.height = CANVAS_HEIGHT_PX;

      CANVAS_ASPECT_RATIO = CANVAS_WIDTH_PX / parseFloat(CANVAS_HEIGHT_PX);
   }
}

/**
 * Main render loop
 */
function loop()
{
   time_cycles += 1;
   draw();
   
   if (ShowFPS)
   {
      var frameStart = Date.now();
      e_fps.innerHTML = "FPS: " + Math.round(1000 / (frameStart - g_framestart));
      g_framestart = frameStart;
   }
   
   requestAnimFrame(loop);
}

window.requestAnimFrame = (function()
{
   return  window.requestAnimationFrame       || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame    || 
           window.oRequestAnimationFrame      || 
           window.msRequestAnimationFrame     || 
           function(callback, element)
           {
               window.setTimeout(callback, 1000 / 60);
           };
})();

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};
