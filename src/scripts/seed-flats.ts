import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/societyflow";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const Society = mongoose.connection.collection("societies");
  const Wing = mongoose.connection.collection("wings");
  const Flat = mongoose.connection.collection("flats");

  const societies = await Society.find({}).toArray();
  for (const s of societies) {
    const wings = await Wing.find({ societyId: s._id }).toArray();
    for (const w of wings) {
      const floors = 4;
      const perFloor = 4;
      const pfx = w.name.replace(/Wing\s*/i, "").trim() || "A";

      for (let fl = 1; fl <= floors; fl++) {
        for (let u = 1; u <= perFloor; u++) {
          const uStr = u < 10 ? `0${u}` : `${u}`;
          const flatNum = `${pfx}-${fl}${uStr}`;
          const existing = await Flat.findOne({
            societyId: s._id,
            wingId: w._id,
            flatNumber: flatNum,
          });
          if (!existing) {
            await Flat.insertOne({
              societyId: s._id,
              wingId: w._id,
              flatNumber: flatNum,
              floor: fl,
              bhkType: "2 BHK",
              defaultOccupancyType: "VACANT",
              isActive: true,
              status: "ACTIVE",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      await Wing.updateOne(
        { _id: w._id },
        {
          $set: {
            totalFloors: floors,
            flatsPerFloor: perFloor,
            totalFlats: floors * perFloor,
          },
        }
      );
    }

    const count = await Flat.countDocuments({ societyId: s._id });
    await Society.updateOne({ _id: s._id }, { $set: { totalFlats: count } });
    console.log(
      `Society "${s.name}" updated with ${count} flats across ${wings.length} wings.`
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
