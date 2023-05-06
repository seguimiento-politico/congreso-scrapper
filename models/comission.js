const mongoose = require('mongoose');

const subcomissionSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const comissionSchema = new mongoose.Schema({
  term: String,
  name: String,
  code: String,
  type: String,
  subcomissions: [subcomissionSchema]
});

comissionSchema.methods.updateCommission = async function (term, commissionData) {
  const existingCommission = await Commission.findOne({ term: term, code: commissionData.code });

  if (existingCommission) {
    Object.assign(existingCommission, commissionData);
    await existingCommission.save();
  } else {
    await Commission.create({ ...commissionData, term });
  }
};

comissionSchema.methods.updateSubcommission = async function (term, commissionCode, subcommissionData) {
  const existingCommission = await Commission.findOne({ term: term, code: commissionCode });

  if (existingCommission) {
    const subcommissionExists = existingCommission.subcomissions.some(
      (subcommission) => subcommission.code === subcommissionData.code
    );

    if (!subcommissionExists) {
      existingCommission.subcomissions.push(subcommissionData);
      await existingCommission.save();
    }
  } else {
    console.log(`Unable to find commission with code ${commissionCode} in term ${term}`);
  }
};

comissionSchema.statics.getAll = async function() {
  return await this.find({}).exec();
};

let Commission;
try {
  Commission = mongoose.model('Commission');
} catch (error) {
  Commission = mongoose.model('Commission', comissionSchema);
}

module.exports = Commission;
