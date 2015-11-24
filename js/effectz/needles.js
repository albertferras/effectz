var RAD = Math.PI/180.0;

var RotObject =  function() {
  this.width = 512;
  this.height = 512;
  this.ctx = null;
  
  this.item_size = 7;
  this.item_margin = 0;
  this.items = null;

  this.init = function() {
      if (CANVAS_ASPECT_RATIO > 1) {
          this.width = 512;
          this.height = 512 / CANVAS_ASPECT_RATIO;
      } else {
          this.width = 512 * CANVAS_ASPECT_RATIO;
          this.height = 512;
      }

      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext("2d");

      // Initialize items matrix
      rows = Math.ceil(this.height / (this.item_size + this.item_margin));
      columns = Math.ceil(this.width / (this.item_size + this.item_margin));
      this.items = new Array(rows);
      for (var y = 0; y <= rows; y++) {
        this.items[y] = new Array(columns);
        for (var x = 0; x <= columns; x++) {
            this.items[y][x] = {'angle': (x + y) / Math.PI,
                                'size': this.item_size,
                                'cx': x * (this.item_size + this.item_margin) - this.item_size / 2,
                                'cy': y * (this.item_size + this.item_margin) - this.item_size / 2};
        }
      }
      console.log("items: " + rows + ", "+ columns);
      return;
  }

  this.render = function(time) {
      ctx = this.ctx;
      ctx.save();

      time = time / 2;

      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw items
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      cx = this.width / 2;
      cy = this.height / 2;
      mx = this.width * (MOUSE_POSITION_X / CANVAS_WIDTH_PX);
      my = this.height * (MOUSE_POSITION_Y / CANVAS_HEIGHT_PX);
      dmax = dist(0, 0, cx, cy);

      for (var y = 0; y < this.items.length; y++) {
        for (var x = 0; x < this.items[y].length; x++) {
          item = this.items[y][x];

          // Move
          d2 = (dist(item['cx'], item['cy'], cx, cy)/dmax);
          
          ideal_angle = Math.sin(d2 + time / 20) * 30 + 30;
          ideal_angle += Math.sin(Math.sqrt(x + y) / 2.0 + time/10.0);

          ss = 0.8 * this.item_size;
          ss *= 0.5 * (1 + (Math.sin((-x  + y) / 10 + time/20) + 1) / 2);
          ideal_size = Math.min(this.item_size, ss);

          inc_angle = (ideal_angle - item['angle']);
          if (inc_angle > 0.01) inc_angle /= 20;
          item['angle'] += inc_angle;

          inc_size = (ideal_size - item['size']);
          if (inc_size > 0.01) inc_size /= 20;
          item['size'] += inc_size;

          // Draw
          ctx.save();
          ctx.translate(item['cx'], item['cy']);
          ctx.rotate(item['angle']);
          this.drawItem(ctx, item, x, y);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
      return this.canvas;
  }

  return this;
}

var RotNeedles = function() {
   this.drawItem = function(ctx, item, x, y) {
        ctx.beginPath();
        angle_deg = ((Math.abs(item['angle']) / RAD) % 360);
        dist_zero = (angle_deg > 180) ? 360 - angle_deg : angle_deg;
        color = Math.ceil((dist_zero/180) * 200);
        color = 255 - color;
        ctx.strokeStyle = "rgba(" + color + ", " + color + ", " + color + ", 1.0)";
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.item_size);
        ctx.stroke();
        ctx.closePath();
   }
}

var RotSquare = function() {
   this.drawItem = function(ctx, item, x, y) {

        angle_deg = ((Math.abs(item['angle']) / RAD) % 360);
        dist_zero = (angle_deg > 180) ? 360 - angle_deg : angle_deg;
        //color = Math.ceil((dist_zero/180) * 200);
        //color = 255 - color;*/
        color = Math.ceil(180 - dist_zero);

        ctx.fillStyle = "rgba(" + color + ", " + color + ", " + color + ", 1.0)";
        n = this.item_size;
        n = item['size'];
        ctx.fillRect(-n/2, -n/2, n, n);
   }
}


RotNeedles.prototype = new RotObject();
RotSquare.prototype = new RotObject();