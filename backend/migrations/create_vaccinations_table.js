const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Vaccinations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'References the checkup session if part of a checkup'
      },
      vaccineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Vaccines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      vaccineName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the vaccine administered'
      },
      batchNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Batch number of the vaccine'
      },
      lotNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Lot number of the vaccine'
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Expiry date of the vaccine batch'
      },
      administrationSite: {
        type: DataTypes.ENUM('left-arm', 'right-arm', 'left-thigh', 'right-thigh', 'oral', 'intranasal'),
        allowNull: false,
        defaultValue: 'left-arm',
        comment: 'Body site where vaccine was administered'
      },
      administrationRoute: {
        type: DataTypes.ENUM('Intramuscular', 'Subcutaneous', 'Oral', 'Intranasal', 'Intradermal'),
        allowNull: false,
        defaultValue: 'Intramuscular',
        comment: 'Route of administration'
      },
      dose: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '1',
        comment: 'Dose number (e.g., 1, 2, booster)'
      },
      administeredBy: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of healthcare provider who administered vaccine'
      },
      administeredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Date and time of administration'
      },
      category: {
        type: DataTypes.ENUM('Routine Childhood', 'Adult', 'Adolescent', 'Annual', 'Emergency Use', 'Travel', 'Occupational'),
        allowNull: true,
        comment: 'Category of vaccination'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Clinical notes or observations'
      },
      adverseReactions: {
        type: DataTypes.ENUM('none', 'mild-pain', 'mild-swelling', 'mild-redness', 'other'),
        allowNull: false,
        defaultValue: 'none',
        comment: 'Any immediate adverse reactions observed'
      },
      adverseReactionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Details of adverse reactions if any'
      },
      consentGiven: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether patient/guardian consent was obtained'
      },
      nextDueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when next dose is due (if applicable)'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of user who created this record'
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of user who last updated this record'
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of user who deleted this record'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('Vaccinations', ['patientId'], {
      name: 'idx_vaccinations_patient_id'
    });

    await queryInterface.addIndex('Vaccinations', ['vaccineId'], {
      name: 'idx_vaccinations_vaccine_id'
    });

    await queryInterface.addIndex('Vaccinations', ['administeredAt'], {
      name: 'idx_vaccinations_administered_at'
    });

    await queryInterface.addIndex('Vaccinations', ['sessionId'], {
      name: 'idx_vaccinations_session_id'
    });

    await queryInterface.addIndex('Vaccinations', ['category'], {
      name: 'idx_vaccinations_category'
    });

    await queryInterface.addIndex('Vaccinations', ['deletedAt'], {
      name: 'idx_vaccinations_deleted_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_patient_id');
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_vaccine_id');
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_administered_at');
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_session_id');
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_category');
    await queryInterface.removeIndex('Vaccinations', 'idx_vaccinations_deleted_at');

    // Drop the table
    await queryInterface.dropTable('Vaccinations');
  }
};