/* Turns the screencast frames from record.cjs into the film:
   node encode.cjs <frames dir> <out dir>
   the-bakery.mp4 (H.264, 30 fps, fades from and to cream so it loops),
   poster.webp (the first frame) and sheet.jpg (a frame every 2 s, to check it). */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const [IN, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const frames = JSON.parse(fs.readFileSync(path.join(IN, "frames.json"), "utf8"));
const HOLD = 0.8; // the last frame stays a little before the fade

let list = "ffconcat version 1.0\n";
let total = 0;
frames.forEach((f, i) => {
  const next = frames[i + 1];
  const d = next ? Math.max(0.001, next.t - f.t) : HOLD;
  total += d;
  list += "file '" + f.file + "'\nduration " + d.toFixed(4) + "\n";
});
list += "file '" + frames[frames.length - 1].file + "'\n";
fs.writeFileSync(path.join(IN, "list.ffconcat"), list);

const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const cream = "0xfefadc";
const mp4 = path.join(OUT, "the-bakery.mp4");
ff(["-f", "concat", "-safe", "0", "-i", path.join(IN, "list.ffconcat"),
  "-vf", `fps=30,fade=t=in:st=0:d=0.35:color=${cream},fade=t=out:st=${(total - 0.45).toFixed(2)}:d=0.45:color=${cream},format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-profile:v", "high", "-movflags", "+faststart", "-an", mp4]);
ff(["-i", path.join(IN, frames[0].file), "-c:v", "libwebp", "-quality", "82", path.join(OUT, "poster.webp")]);
ff(["-i", mp4, "-vf", "fps=1/2,scale=360:-1,tile=4x4:padding=6:color=white", "-frames:v", "1", "-q:v", "4", path.join(OUT, "sheet.jpg")]);
console.log("frames", frames.length, "seconds", total.toFixed(1), "mp4 bytes", fs.statSync(mp4).size);
