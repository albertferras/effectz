var RAD = Math.PI/180.0;
var MAX_HP = 255;
var SIZE = 300;
var COLOR_RANGE = 360;

var TIME_TO_RAISE = 20;
var TIME_TO_DIE = 250;
var TIME_TO_REBORN = TIME_TO_DIE + 60;

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}


var Life =  function() {
  this.ctx = null;
  
  this.balance_items_alive_percent = 0.9;
  this.items = null;

  this.init = function() {
      if (CANVAS_ASPECT_RATIO > 1) {
          this.width = SIZE;
          this.height = SIZE / CANVAS_ASPECT_RATIO;
      } else {
          this.width = SIZE * CANVAS_ASPECT_RATIO;
          this.height = SIZE;
      }

      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext("2d");
      this.imagedata = this.ctx.createImageData(this.width, this.height);

      // Initialize items matrix
      this.rows = Math.ceil(this.height);
      this.columns = Math.ceil(this.width);
      this.total_items = this.rows * this.columns;
      this.items = new Array(this.rows);
      for (var y = 0; y < this.rows; y++) {
        this.items[y] = new Array(this.columns);
        for (var x = 0; x < this.columns; x++) {
            this.items[y][x] = {'hp': 0,  // hit points
                                'birth': -99999,
                                'hue': 0,
                                'an': 0,  // alive neighbours
                                'x': x,
                                'y': y};
        }
      }
      this.total_alive = 0;

      // init palette
      this.palette = new Array(MAX_HP);
      for (var hp = 0; hp <= MAX_HP; hp++) {
          this.palette[hp] = new Array(COLOR_RANGE);
          for (var t = 0; t <= COLOR_RANGE; t++) {
              v = hp/MAX_HP;
              this.palette[hp][t] = HSVtoRGB(t / COLOR_RANGE, 0.8, v);
          }
      }
      return;
  }

  this.render = function(time) {
      this.time = time;
      ctx = this.ctx;

      if (time % 2 == 0) {
        rx = Math.round(Math.random() * this.columns);
        ry = Math.round(Math.random() * this.rows);
      } else {
        rx = ry = -1;
      }
      total_items_alive_wanted = this.total_items * this.balance_items_alive_percent;

      // mouse position
      mx = this.width * (MOUSE_POSITION_X / CANVAS_WIDTH_PX);
      my = this.height * (MOUSE_POSITION_Y / CANVAS_HEIGHT_PX);

      // Compute threshold to balance "random spreading" so that total number of items alive 
      // is this.total_items * this.balance_items_alive_percent = total_items_alive_wanted
      pending_to_raise = Math.max(0, total_items_alive_wanted - this.total_alive);
      // if this.total_alive is the total number of items alive and X=pending_to_raise of them spread,
      // we will have what we want. Compute as a percentage and use as a threshold for the math.random
      threshold = Math.max(0.8, 1 - pending_to_raise / this.total_alive);

      var pixelPos = 0;
      for (var y = 0; y < this.items.length; y++) {
        for (var x = 0; x < this.items[y].length; x++) {
          item = this.items[y][x];
          
          // Active logic
          if ((x == rx) && (y == ry) && pending_to_raise > 0 && item['hp'] == 0) {
              this.setHP(item, MAX_HP);
              item['hue'] = (time * 30) % COLOR_RANGE;
          }
          
          time_since_birth = time - item['birth'];
          // draw
          hp = Math.floor(item['hp']);
          //hp_smooth = hp / (Math.max(1, TIME_TO_RAISE - time_since_birth));
          time_till_raise = Math.max(0, TIME_TO_RAISE - time_since_birth);
          hp_smooth = hp * (1 - time_till_raise / TIME_TO_RAISE);
          hp_smooth = Math.round(hp_smooth);
          color = (item['hue'] + time) % COLOR_RANGE;
          rgb = this.palette[hp_smooth][color];

          //rgb = HSVtoRGB((item['birth'] % 255)/255, color/255, color/255);
          this.imagedata.data[pixelPos++] = rgb.r;
          this.imagedata.data[pixelPos++] = rgb.g;
          this.imagedata.data[pixelPos++] = rgb.b;
          this.imagedata.data[pixelPos++] = 256;

          // decay + spread
          if (item['hp'] > 0) {
              // decay
              neighbor_bonus = (time_since_birth < TIME_TO_DIE) ? (0.2 * item['an'] / 9) : 0.13;
              new_hp = item['hp'] * Math.min(1.0, 0.8 + neighbor_bonus);
              // mouse killing (points near mouse pointer will die faster)
              //mouse_dist = dist(mx, my, x, y);
              //bonus_decay = 200 * 1 / (0.5 * mouse_dist * mouse_dist);
              //new_hp -= bonus_decay;
              if (new_hp < 20) new_hp = 0;
              this.setHP(item, new_hp);

              if (item['hp'] > 100 && x > 0 && x < this.columns - 1 && y > 0 && y < this.rows - 1) {
                  r = Math.random();
                  r += (threshold / 10) * item['an']; // Bonus: Items with many neighbors have more chance to spread than those with less
                  if (r > threshold) {
                    x2 = getRandomInt(x - 1, x + 1);
                    y2 = getRandomInt(y - 1, y + 1);
                    
                    item2 = this.items[y2][x2];
                    hp2_before = item2['hp'];

                    hp = Math.min(1, pending_to_raise / 100) * MAX_HP;
                    hp = Math.min(MAX_HP, hp2_before + hp);
                    this.setHP(item2, MAX_HP);
                    if (hp2_before == 0)
                        item2['hue'] = item['hue'];
                    else
                        item2['hue'] = Math.floor((item['hue'] + item2['hue']) / 2);
                  }
              }
          }
        }
      }
      this.ctx.putImageData(this.imagedata, 0, 0);
      return this.canvas;
  }

  this.setHP = function(item, hp) {
      hp_before = item['hp'];
      if (hp_before == hp) return;

      time_since_birth = this.time - item['birth'];
      
      if (hp_before < hp) {
          // Set more hp
          if (time_since_birth >= TIME_TO_DIE && time_since_birth < TIME_TO_REBORN
               && hp_before == 0) { // Can't resurrect if timeout didnt expire
              // Never resurrect if its no time to reborn
              return;
          }
          // Recover
          if (time_since_birth > TIME_TO_DIE && hp_before > 0) { // Don't recover is set to die
              // Never recover if its time to die
              return;
          }
      }
      else {
          // Decay
          // Allways OK
      }

      item['hp'] = hp;
      inc = 0;
      if (hp_before == 0 && hp > 0) {
          inc = 1;
          item['birth'] = this.time;
      }
      else if (hp_before > 0 && hp == 0) {
          inc = -1;
      }
      
      if (inc != 0) {
          this.total_alive += inc;
          miny = Math.max(0, item['y'] - 1);
          maxy = Math.min(this.rows - 1, item['y'] + 1);
          minx = Math.max(0, item['x'] - 1);
          maxx = Math.min(this.columns - 1, item['x'] + 1);
          for (y = miny; y <= maxy; y++) {
              for (x = minx; x <= maxx; x++) {
                  this.items[y][x]['an'] += inc;
              }
          }
      }
  }

  return this;
}
