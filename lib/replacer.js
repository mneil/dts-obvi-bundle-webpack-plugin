const fs = require("fs");

class Replacer {
  /**
   *
   * @param {string} text
   */
  constructor(text) {
    this.delta = 0;
    this.dirty = false;
    this.text = text;
  }
  /**
   *
   * @param {number} start
   * @param {number} end
   * @param {string} text
   */
  replace(start, end, text) {
    this.dirty = true;
    const newText = this.text.slice(0, start + this.delta) + text + this.text.slice(end + this.delta);
    this.delta += text.length - (end - start);
    this.text = newText;
    return this.text;
  }

  /**
   * Saves the replaced text into a file a filePath
   * @param {string} filePath
   */
  save(filePath) {
    if (!this.dirty) return;
    fs.writeFileSync(filePath, this.text);
  }
}

module.exports = Replacer;
