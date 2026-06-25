const url = process.argv[2];
if (!url) {
  console.error("Please provide the webhook URL");
  process.exit(1);
}
fetch(url, {
  method: "POST",
  body: JSON.stringify({
    to: "benjamin@test.com",
    subject: "Test Subject",
    html: "<h1>Test HTML</h1>"
  })
}).then(res => {
  console.log("Status:", res.status);
  return res.text();
}).then(text => {
  console.log("Body:", text);
}).catch(err => {
  console.error("Error:", err);
});
