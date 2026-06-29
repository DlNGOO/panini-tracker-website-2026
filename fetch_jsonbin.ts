const id = '6a3cda32f5f4af5e292d6a3e';
const key = '$2a$10$47nbhpcIF7Y.Vql9oC5Koe1oicP4/f/M2S5MjNeg98N9EnjDyCeIm';
const testData = {
  _db_cleared_to_zero: true,
  _groups: {
    "g-2b61ln": {
      "id": "g-2b61ln",
      "name": "Testgruppe",
      "avatar": "🦁",
      "inviteCode": "GWR5D3",
      "createdBy": "test"
    }
  },
  "test": {
    "id": "test",
    "name": "Test",
    "password": "test123",
    "avatar": "🦁",
    "owned": ["GER1", "GER2"],
    "duplicates": {},
    "email": "test@test.com",
    "phoneNumber": "+491701234567",
    "notifyPreference": "both",
    "groupId": "g-2b61ln"
  }
};

fetch('https://api.jsonbin.io/v3/b/'+id, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Master-Key': key
  },
  body: JSON.stringify(testData)
})
  .then(async r => {
    console.log("Status:", r.status);
    const text = await r.text();
    console.log("Response:", text);
  })
  .catch(e => console.error(e));

