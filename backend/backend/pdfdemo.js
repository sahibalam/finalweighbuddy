// final_report.js
const fs = require("fs");
const PDFDocument = require("pdfkit");

// Extracted after analysing your uploaded image
const COLORS = {
  header: "#d9def1",
  measured: "#fbfc1a",
  result: "#c7efcb",
  ok: "#c8efcb",
  advisory: "#ffd5d6",
  lightGrey: "#f6f6f6",
  dark: "#1a1a1a"
};

function box(doc, x, y, w, h, fill, text, size = 10, align = "center") {
  if (fill) {
    doc.save().rect(x, y, w, h).fill(fill).restore();
  }
  doc.rect(x, y, w, h).stroke();

  if (text) {
    doc
      .fontSize(size)
      .fillColor(COLORS.dark)
      .text(text, x + 4, y + 4, {
        width: w - 8,
        height: h - 8,
        align
      });
  }
}

function generate() {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 15
  });

  const filename = "Vehicle_Load_Report_FINAL.pdf";
  doc.pipe(fs.createWriteStream(filename));

  const leftX = doc.page.margins.left;
  let y = 40;

  //--------------------------------------------------------------------
  // TITLE — EXACT
  //--------------------------------------------------------------------
  doc
    .fontSize(18)
    .fillColor("#000")
    .text("Vehicle Load & Compliance Report", leftX, y, {
      width: doc.page.width - 30,
      align: "center"
    });

  y += 32;

  //--------------------------------------------------------------------
  // LEFT 4 COLUMNS — EXACT FROM IMAGE
  //--------------------------------------------------------------------
  const columnW = 155;
  const gap = 8;

  const leftBoxes = [
    ["Front Axle", "1470", "1241", "-229", "OK"],
    ["GVM", "3150", "2987", "-163", "OK"],
    ["Rear Axle", "1770", "1746", "-24", "OK"],
    ["TBM", "350", "238", "-112", "OK"]
  ];

  leftBoxes.forEach((row, i) => {
    const [title, comp, meas, res, status] = row;
    const x = leftX + i * (columnW + gap);

    box(doc, x, y, columnW, 26, COLORS.header, title, 11);
    box(doc, x, y + 26, columnW, 22, COLORS.result, comp);
    box(doc, x, y + 48, columnW, 22, COLORS.measured, meas);
    box(doc, x, y + 70, columnW, 22, COLORS.result, res);
    box(doc, x, y + 92, columnW, 20, COLORS.ok, status);
  });

  //--------------------------------------------------------------------
  // RIGHT COLUMNS — GCM / GTM / Axles EXACT
  //--------------------------------------------------------------------
  const rightStart = leftX + (columnW + gap) * 4 + 10;
  const rightW = 120;

  // GCM
  box(doc, rightStart, y, rightW, 26, COLORS.header, "GCM", 11);
  box(doc, rightStart, y + 26, rightW, 22, COLORS.result, "6250");
  box(doc, rightStart, y + 48, rightW, 22, COLORS.measured, "5489");
  box(doc, rightStart, y + 70, rightW, 22, COLORS.result, "-761");
  box(doc, rightStart, y + 92, rightW, 20, COLORS.ok, "OK");

  // GTM
  const gtmX = rightStart + rightW + gap;
  box(doc, gtmX, y, rightW, 26, COLORS.header, "GTM", 11);
  box(doc, gtmX, y + 26, rightW, 22, COLORS.result, "3073");
  box(doc, gtmX, y + 48, rightW, 22, COLORS.measured, "2502");
  box(doc, gtmX, y + 70, rightW, 22, COLORS.result, "-571");
  box(doc, gtmX, y + 92, rightW, 20, COLORS.ok, "OK");

  // Axles
  const axX = gtmX + rightW + gap;
  box(doc, axX, y, rightW, 26, COLORS.header, "Axles", 11);
  box(doc, axX, y + 32, 55, 22, COLORS.measured, "1219");
  box(doc, axX + 61, y + 32, 55, 22, COLORS.measured, "1283");
  box(doc, axX + 6, y + 60, rightW - 12, 22, COLORS.result, "-");
  box(doc, axX, y + 92, rightW, 20, COLORS.ok, "OK");

  //--------------------------------------------------------------------
  // ATM & BTC EXACT LAYOUT
  //--------------------------------------------------------------------
  const atmY = y + 130;
  const smallW = 180;

  // ATM
  box(doc, rightStart, atmY, smallW, 26, COLORS.header, "ATM", 11);
  box(doc, rightStart, atmY + 26, smallW, 22, COLORS.result, "3200");
  box(doc, rightStart, atmY + 48, smallW, 22, COLORS.measured, "2740");
  box(doc, rightStart, atmY + 70, smallW, 22, COLORS.result, "-460");
  box(doc, rightStart, atmY + 92, smallW, 20, COLORS.ok, "OK");

  // BTC
  const btcX = rightStart + smallW + gap;
  box(doc, btcX, atmY, smallW, 26, COLORS.header, "BTC", 11);
  box(doc, btcX, atmY + 26, smallW, 22, COLORS.result, "3500");
  box(doc, btcX, atmY + 48, smallW, 22, COLORS.measured, "2740");
  box(doc, btcX, atmY + 70, smallW, 22, COLORS.result, "-760");
  box(doc, btcX, atmY + 92, smallW, 20, COLORS.ok, "OK");

  //--------------------------------------------------------------------
  // CAR LOAD / CARAVAN LOAD — EXACT
  //--------------------------------------------------------------------
  const loadY = atmY + 130;
  const loadW = 240;

  box(
    doc,
    leftX,
    loadY,
    loadW,
    58,
    "#fff",
    "Car Load\nFront 2 ADULTS\nRear CHOOSE\nFuel FULL"
  );

  box(doc, leftX, loadY + 68, loadW, 58, "#fff", "Caravan Load\nVan Water FULL");

  //--------------------------------------------------------------------
  // ADVISORY — EXACT TEXT
  //--------------------------------------------------------------------
  const advX = leftX + loadW + 12;

  box(
    doc,
    advX,
    loadY,
    350,
    118,
    COLORS.advisory,
    "Advisory Only\n\nVan to Car Ratio <85%  84%\nTow Ball % 8 to 10%  9%\nAmplitude VAN Axle group  3200\nActual Axle Group  2502\nPossible Spare Capacity  320  see below"
  );

  // BTC Advisory Small Box
  box(
    doc,
    advX + 365,
    loadY + 6,
    150,
    44,
    "#ffe1e1",
    "Advisory BTC Ratio\nIDEAL <80%    78%"
  );

  //--------------------------------------------------------------------
  // LONG LEGAL NOTE — EXACT
  //--------------------------------------------------------------------
  const noteY = loadY + 135;

  box(
    doc,
    leftX,
    noteY,
    doc.page.width - 30,
    105,
    "#fff",
    "Information provided is true and correct at the time of weighing, however Vanweight bears no responsibility for changes in weights or circumstances after the printing of this document.\n\nThe document is a design only and cannot be used for Licensing or insurance purposes. Please note that if this report shows any areas of your vehicle that are overloaded, your vehicle may not be safe to drive and may pose a safety risk to yourself and other road users. It is now an optionality to resolve any vehicle overloading issues prior to driving the vehicle any further. We accept no liability or responsibility if you continue to drive your vehicle once we have provided with a report",
    9
  );

  //--------------------------------------------------------------------
  // 6 DEFINITIONS — EXACT TEXT
  //--------------------------------------------------------------------
  const defY = noteY + 120;
  const defW = 150;

  const defs = [
    ["(GVM) Gross Vehicle", "Mass of the laden vehicle as measured under its wheels."],
    ["(TBM) Tow Ball Mass", "Is the weight imposed on the tow vehicle by the coupling of a laden Oraven or Camper."],
    ["(GTM) Gross Traffic Mass", "Is the weight of the laden Oraven when the Oraven is coupled to the tow vehicle."],
    ["(ATM) Aggressive Traffic Mass", "Is the total weight of the Carsvan including TRM and all extras loaded."],
    ["(GCM) Gross Combined Mass", "Is the total weight of both the tow vehicle and the"],
    ["(BTC) Resided Towing Capacity", "Is the total weight that a vehicle is allowed to tow as specified by the vehicle manufacturer."]
  ];

  let dx = leftX;
  defs.forEach(d => {
    box(doc, dx, defY, defW, 70, COLORS.lightGrey, d[0] + "\n" + d[1], 8, "left");
    dx += defW + 8;
  });

  //--------------------------------------------------------------------
  // LAST SPARE CAPACITY NOTE — EXACT
  //--------------------------------------------------------------------
  box(
    doc,
    leftX,
    defY + 78,
    doc.page.width - 30,
    28,
    "#fff",
    "Spare Capacity occurs when your van compliance axle group loading is greater than your van ATM. The ATM may be able to be adjusted upwards."
  );

  //--------------------------------------------------------------------
  doc.end();
  console.log("PDF generated:", filename);
}

generate();
