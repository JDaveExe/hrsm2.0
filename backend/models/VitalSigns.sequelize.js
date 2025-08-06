const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VitalSigns = sequelize.define('VitalSigns', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Patients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 30.0,
        max: 45.0
      }
    },
    heartRate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 30,
        max: 200
      }
    },
    systolicBP: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 60,
        max: 250
      }
    },
    diastolicBP: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 40,
        max: 150
      }
    },
    respiratoryRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 5,
        max: 40
      }
    },
    oxygenSaturation: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 60,
        max: 100
      }
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0.5,
        max: 500.0
      }
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 20,
        max: 300
      }
    },
    clinicalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'vital_signs',
    timestamps: true,
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['recordedAt']
      },
      {
        fields: ['patientId', 'recordedAt']
      }
    ]
  });

  // Define associations
  VitalSigns.associate = function(models) {
    VitalSigns.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    });
  };

  return VitalSigns;
};
