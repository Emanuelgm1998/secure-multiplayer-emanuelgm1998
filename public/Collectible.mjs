export default class Collectible {
  constructor({ id, value, x, y }) {
    this.id = id;
    this.value = value;
    this.x = x;
    this.y = y;
    this.radius = 5;
  }
}
