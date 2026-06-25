const id = '6a3cda32f5f4af5e292d6a3e';
const key = '$2a$10$47nbhpcIF7Y.Vql9oC5Koe1oicP4/f/M2S5MjNeg98N9EnjDyCeIm';

async function fetchVersions() {
  for (let i = 1; i <= 20; i++) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${id}/${i}`, {headers: {'X-Master-Key': key}});
      if (res.ok) {
        const d = await res.json();
        console.log(`--- VERSION ${i} ---`);
        console.log("Keys:", Object.keys(d.record || {}));
      } else {
        break; // Stop when version is not found
      }
    } catch (e) {
      console.error(e);
      break;
    }
  }
}
fetchVersions();
