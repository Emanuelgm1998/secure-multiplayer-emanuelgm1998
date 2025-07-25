export default class Player {
  constructor({ id, score = 0, x = 100, y = 100, color = 'white' }) {
    this.id = id;
    this.score = score;
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 10;
    this.pop = 0;
  }
  movePlayer(direction, speed) {
    switch (direction) {
      case 'up': this.y -= speed; break;
      case 'down': this.y += speed; break;
      case 'left': this.x -= speed; break;
      case 'right': this.x += speed; break;
    }
  }
  collision(collectible) {
    const dx = this.x - collectible.x;
    const dy = this.y - collectible.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius + collectible.radius;
  }
  calculateRank(players) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${myRank}/${players.length}`;
  }
}
