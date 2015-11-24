var dist = function dist(a, b, c, d) {
  return Sqrt((a - c) * (a - c) + (b - d) * (b - d));
}

var Plasma =  function() {
  this.resolution = [256, 256];
  this.ctx = null;
  this.imagedata = null;
  this.init = function() {
      this.resolution = [256, Math.ceil(256 / CANVAS_ASPECT_RATIO)];

      this.canvas = createCanvas(this.resolution[0], this.resolution[1]);
      this.ctx = this.canvas.getContext("2d");
      this.imagedata = this.ctx.createImageData(this.resolution[0], this.resolution[1]);

      function rgb(r,g,b) {
         return [r, g, b];
      }
      
      this.palettes = [];
      
      var palette = [];
      for (var i=0; i<256; i++)
      {
         palette.push(rgb(i,i,i));
      }
      this.palettes.push(palette);
      
      palette = [];
      for (var i=0; i<128; i++)
      {
         palette.push(rgb(i*2,i*2,i*2));
      }
      for (var i=0; i<128; i++)
      {
         palette.push(rgb(255-(i*2),255-(i*2),255-(i*2)));
      }
      this.palettes.push(palette);
      
      palette = new Array(256);
      for (var i = 0; i < 64; i++)
      {
         palette[i] = rgb(i << 2,255 - ((i << 2) + 1),64);
         palette[i+64] = rgb(255,(i << 2) + 1,128);
         palette[i+128] = rgb(255 - ((i << 2) + 1),255 - ((i << 2) + 1),192);
         palette[i+192] = rgb(0,(i << 2) + 1,255);
      }
      this.palettes.push(palette);
      
      palette = [];
      for (var i = 0,r,g,b; i < 256; i++)
      {
         r = ~~(128 + 128 * Sin(Math.PI * i / 32));
         g = ~~(128 + 128 * Sin(Math.PI * i / 64));
         b = ~~(128 + 128 * Sin(Math.PI * i / 128));
         palette.push(rgb(r,g,b));
      }
      this.palettes.push(palette);
      
      palette = [];
      for (var i = 0,r,g,b; i < 256; i++)
      {
          r = ~~(Sin(0.3 * i) * 64 + 190),
          g = ~~(Sin(0.3 * i + 2) * 64 + 190),
          b = ~~(Sin(0.3 * i + 4) * 64 + 190);
          palette.push(rgb(r,g,b));
      }
      this.palettes.push(palette);
      
      this.PaletteIndex = 2;
      return;
  }

  this.render = function(time) {
      var pixelPos = 0;
      for (var y=0, x; y < this.imagedata.height; y++) {
        for (x=0; x < this.imagedata.width; x++) {
           // map plasma pixels to canvas pixels using the virtual pixel size
           color = this.plasma_func(x, y, time);
           this.imagedata.data[pixelPos++] = color[0];
           this.imagedata.data[pixelPos++] = color[1];
           this.imagedata.data[pixelPos++] = color[2];
           this.imagedata.data[pixelPos++] = 256;
        }
      }
      this.ctx.putImageData(this.imagedata, 0, 0);
      return this.canvas;
  }

  this.plasma_func = function(x, y, time) {
       p = Math.abs(Sin(time / 50)) * 16 + 16;

       c = ((Sin(dist(x + time, y, 128.0, 128.0) / 8.0)
            + Sin(dist(x - time, y, 64.0, 64.0) / 8.0)
            + Sin(dist(x, y + time / 7, 192.0, 64) / 7.0)
            + Sin(dist(x, y, 192.0, 100.0) / 8.0)) + 4) * p;
       color = this.palettes[this.PaletteIndex][(~~c + time) % 256];
       return color;
  }
  return this;
}



var Plasma2 = function() {
  this.resolution = [256, 256];
  this.plasma_func = function(x, y, time) {
       c = (128 + (128 * Sin(x * 0.0625)) +
            128 + (128 * Sin(y * 0.03125)) +
            128 + (128 * Sin(dist(x + time, y - time, 256, 256) * 0.125)) +
            128 + (128 * Sin(Sqrt(x * x + y * y) * 0.125)) ) * 0.25;
       color = this.palettes[this.PaletteIndex][(~~c + time) % 256];
       return color;
  }
  return this;
}

Plasma2.prototype = new Plasma();
