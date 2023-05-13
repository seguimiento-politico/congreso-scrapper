const mongoose = require('mongoose');

const subcomissionSchema = new mongoose.Schema({
  name: String,
  code: String,
  startDate: String,
  endDate: String,
  creation_request_initiative: String,
  creation_initiative: String,
  representatives: [{
    id: String,
    name: String,
    position: String,
    startDate: String,
    endDate: String
  }]
});

const comissionSchema = new mongoose.Schema({
  term: String,
  name: String,
  code: String,
  type: String,
  startDate: String,
  endDate: String,
  creation_request_initiative: String,
  creation_initiative: String,
  subcomissions: [subcomissionSchema],
  representatives: [{
    id: String,
    name: String,
    position: String,
    startDate: String,
    endDate: String
  }]
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

comissionSchema.methods.updateCommissionInitiatives = async function (term, commissionCode, initiativesData) {
  const existingCommission = await Commission.findOne({ term: term, code: commissionCode });

  if (existingCommission) {
    existingCommission.initiatives = initiativesData;
    await existingCommission.save();
  } else {
    console.log(`Unable to find commission with code ${commissionCode} in term ${term}`);
  }
};

comissionSchema.methods.updateSubcommissionInitiatives = async function (term, commissionCode, subcommissionCode, initiativesData) {
  const existingCommission = await Commission.findOne({ term: term, code: commissionCode });

  if (existingCommission) {
    const subcommissionIndex = existingCommission.subcomissions.findIndex(
      (subcommission) => subcommission.code === subcommissionCode
    );

    if (subcommissionIndex !== -1) {
      existingCommission.subcomissions[subcommissionIndex].initiatives = initiativesData;
      await existingCommission.save();
    } else {
      console.log(`Unable to find subcommission with code ${subcommissionCode} in commission ${commissionCode} and term ${term}`);
    }
  } else {
    console.log(`Unable to find commission with code ${commissionCode} in term ${term}`);
  }
};

comissionSchema.statics.get = async function(term = null, commissionCode = null) {
  if (term) {
    if (commissionCode) {
      return await this.findOne({ term: term, code: commissionCode }).exec();
    } else {
      return await this.find({ term: term }).exec();
    }
  } else {
    return await this.find({}).exec();
  }
};



let Commission;
try {
  Commission = mongoose.model('Commission');
} catch (error) {
  Commission = mongoose.model('Commission', comissionSchema);
}

module.exports = Commission;
