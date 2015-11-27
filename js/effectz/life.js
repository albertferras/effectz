var RAD = Math.PI/180.0;
var MAX_HP = 255;
var SIZE = 1000;

var TIMEOUT_START = 400;
var TIMEOUT_DIE = 20;
var TIMEOUT_REBORN = 0;

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Life =  function() {
  this.ctx = null;
  
  this.balance_items_alive_percent = 0.4;
  this.item_size = 7;
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

      // Initialize items matrix
      this.rows = Math.ceil(this.height / this.item_size);
      this.columns = Math.ceil(this.width / this.item_size);
      this.total_items = this.rows * this.columns;
      this.items = new Array(this.rows);
      for (var j = 0; j < this.rows; j++) {
        this.items[j] = new Array(this.columns);
        for (var i = 0; i < this.columns; i++) {
            this.items[j][i] = {'hp': 0,  // hit points
                                'timeout': TIMEOUT_REBORN,
                                'an': 0,  // alive neighbours
                                'i': i, 'j': j,
                                'x': i * this.item_size - this.item_size / 2,
                                'y': j * this.item_size - this.item_size / 2};
        }
      }
      this.total_alive = 0;
      return;
  }

  this.render = function(time) {
      console.log(time);
      ctx = this.ctx;
      ctx.save();

      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ri = Math.round(Math.random() * this.columns);
      rj = Math.round(Math.random() * this.rows);
      n = this.item_size;
      n_half = this.item_size / 2;
      total_items_alive_wanted = this.total_items * this.balance_items_alive_percent;

      // mouse position
      mx = this.width * (MOUSE_POSITION_X / CANVAS_WIDTH_PX);
      my = this.height * (MOUSE_POSITION_Y / CANVAS_HEIGHT_PX);
      mi = mx / this.item_size;
      mj = my / this.item_size;

      // Compute threshold to balance "random spreading" so that total number of items alive 
      // is this.total_items * this.balance_items_alive_percent = total_items_alive_wanted
      pending_to_raise = Math.max(0, total_items_alive_wanted - this.total_alive);
      // if this.total_alive is the total number of items alive and X=pending_to_raise of them spread,
      // we will have what we want. Compute as a percentage and use as a threshold for the math.random
      threshold = Math.max(0.8, 1 - pending_to_raise / this.total_alive);

      // Draw items
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      for (var j = 0; j < this.items.length; j++) {
        for (var i = 0; i < this.items[j].length; i++) {
          item = this.items[j][i];
          
          // Active logic
          if ((i == ri) && (j == rj) && pending_to_raise > 200) {
              this.setHP(item, MAX_HP);
          }

          item['timeout'] = Math.max(TIMEOUT_REBORN, item['timeout'] - 1);
          if (item['hp'] > 0) {
              // Draw
              ctx.save();
              ctx.translate(item['x'], item['y']);
              
              // draw square
              color = Math.floor(item['hp']);
              ctx.fillStyle = "rgba(" + color + ", " + color + ", " + color + ", 1.0)";
              ctx.fillRect(-n_half, -n_half, n, n);

              ctx.stroke();
              ctx.restore();

              // decay
              neighbor_bonus = (item['timeout'] > TIMEOUT_DIE) ? (0.2 * item['an'] / 9) : 0.15;
              new_hp = item['hp'] * (0.8 + neighbor_bonus);
              // mouse killing (points near mouse pointer will die faster)
              mouse_dist = dist(mi, mj, i, j);
              bonus_decay = 80 * 1 / (0.5 * mouse_dist * mouse_dist);
              new_hp -= bonus_decay;
              if (new_hp < 40) new_hp = 0;
              this.setHP(item, new_hp);

              if (i > 0 && i < this.columns - 1 && j > 0 && j < this.rows - 1) {
                  r = Math.random();
                  r += (threshold / 100) * item['an']; // Bonus: Items with many neighbors have more chance to spread than those with less
                  if (r > threshold) {
                    i2 = getRandomInt(i - 1, i + 1);
                    j2 = getRandomInt(j - 1, j + 1);
                    
                    hp = Math.min(1, pending_to_raise / 100) * MAX_HP;
                    hp = Math.min(MAX_HP, this.items[j2][i2]['hp'] + hp);
                    this.setHP(this.items[j2][i2], MAX_HP);
                  }
              }
          }
        }
      }
      ctx.restore();
      return this.canvas;
  }

  this.setHP = function(item, hp) {
      hp_before = item['hp'];
      if (hp_before == hp) return;
      
      if (hp_before < hp) {
          // Set more hp
          if (item['timeout'] > TIMEOUT_REBORN
               && TIMEOUT_REBORN < TIMEOUT_DIE
               && hp_before == 0) { // Can't resurrect if timeout didnt expire
              // Never resurrect if its no time to reborn
              return;
          }
          // Recover
          if (item['timeout'] < TIMEOUT_DIE && hp_before > 0) { // Don't recover is set to die
              // Never resurrect if its no time to reborn
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
          item['timeout'] = TIMEOUT_START;
      }
      else if (hp_before > 0 && hp == 0) {
          inc = -1;
      }
      
      if (inc != 0) {
          this.total_alive += inc;
          minj = Math.max(0, item['j'] - 1);
          maxj = Math.min(this.rows - 1, item['j'] + 1);
          mini = Math.max(0, item['i'] - 1);
          maxi = Math.min(this.columns - 1, item['i'] + 1);
          for (j = minj; j <= maxj; j++) {
              for (i = mini; i <= maxi; i++) {
                  this.items[j][i]['an'] += inc;
              }
          }
      }
  }

  return this;
}
