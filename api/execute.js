export default function handler(req, res) {
  if (req.method === "POST") {
    const email = req.body?.inArguments?.[0]?.Email || "";
    const isBlocked = (email === "prova@prova.it");

    return res.status(200).json({ branchResult: isBlocked ? "NO" : "YES" });
  } else {
    return res.status(405).send("Method Not Allowed");
  }
}
