const id = '6a3cda32f5f4af5e292d6a3e';
const key = '$2a$10$47nbhpcIF7Y.Vql9oC5Koe1oicP4/f/M2S5MjNeg98N9EnjDyCeIm';
fetch('https://api.jsonbin.io/v3/b/'+id+'/latest', {headers: {'X-Master-Key': key}})
  .then(r=>r.json())
  .then(d=>console.log(JSON.stringify(d, null, 2)))
  .catch(e=>console.error(e));
