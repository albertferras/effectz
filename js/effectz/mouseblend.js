var dist = function dist(a, b, c, d) {
  return Sqrt((a - c) * (a - c) + (b - d) * (b - d));
}


var MouseBlend =  function() {
  this.width = 512;
  this.height = 512;
  this.ctx = null;

  this.cursor_size = 40;
  this.speed_log_limit = 20;

  this.last_p = null;
  this.last_size = null;
  
  this.speed_log = null;
  this.speed_i = null;
  

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
      
      // set speed log
      this.speed_log = [];
      for (i = 0; i < this.speed_log_limit; i++) this.speed_log.push(1);
      this.speed_i = 0;
      return;
  }

  this.log_speed = function(new_speed) {
      // Log new speed
      this.speed_log[this.speed_i] = new_speed;
      this.speed_i = (this.speed_i + 1) % this.speed_log_limit;
  }

  this.avg_speed = function() {
      // Returns the average of last X wanted sizes
      sum = 0;
      for (i = 0; i < this.speed_log.length; i++){
          sum += this.speed_log[i]
      }
      return sum/this.speed_log.length;
  }

  this.render = function(time) {
      c2 = this.ctx;
      c2.save();
      
      x = this.width * (MOUSE_POSITION_X / CANVAS_WIDTH_PX);
      y = this.height * (MOUSE_POSITION_Y / CANVAS_HEIGHT_PX);
      p = [x, y];
      color = 'hsl(' + (10*time % 360) + ', 80%, 80%)';
      
      if (this.last_p === null) {
          this.last_p = [x, y];
          this.last_size = 1;
      }
      // new wanted size
      n = dist(x, y, this.last_p[0], this.last_p[1]);
      n = Math.max(1, Math.log(n) * 1.5);
      this.log_speed(n);

      // Smooth new size based on average of last X wanted sizes
      n = this.avg_speed();
      
      // fade screen
      c2.fillStyle = "black";
      c2.globalAlpha = 0.1;
      c2.fillRect(0, 0, this.width, this.height);
      c2.globalAlpha = 1.0;
      
      // create polygon to draw
      if (p[0] - n < this.last_p[0] - this.last_size) {
        pa = p;
        pb = this.last_p;
        na = n;
        nb = this.last_size;
      } else {
        pa = this.last_p;
        pb = p;
        na = this.last_size;
        nb = n;
      }
      
      c2.beginPath();
      c2.lineTo(pa[0] - na, pa[1] - na);
      c2.lineTo(pa[0] - na, pa[1] + na);
      if (pa[1] - na < pb[1] - nb)
        c2.lineTo(pb[0] - nb, pb[1] + nb);
      else
        c2.lineTo(pa[0] + na, pa[1] + na);
      c2.lineTo(pb[0] + nb, pb[1] + nb);
      c2.lineTo(pb[0] + nb, pb[1] - nb);
      if (pa[1] - nb < pb[1] - nb)
        c2.lineTo(pa[0] + na, pa[1] - na);
      else
        c2.lineTo(pb[0] - nb, pb[1] - nb);
      c2.closePath();

      c2.fillStyle = color;

      c2.fill();
      c2.restore();

      this.last_p = [x, y];
      this.last_size = n;
      return this.canvas;
  }

  return this;
}
