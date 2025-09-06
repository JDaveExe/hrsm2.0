const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hrsm2'
};

const addMoreFamilies = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database!');
    
    console.log('🔢 Checking current family count...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM Families');
    const currentCount = countResult[0].count;
    console.log(`📊 Current families: ${currentCount}`);
    
    const additionalFamilies = [
      ['Dela Cruz', 'Maria Dela Cruz', '101 Barangka Drive, Marikina City', '09171111111'],
      ['Gonzales', 'Roberto Gonzales', '102 Marikina Heights, Marikina City', '09172222222'],
      ['Fernandez', 'Carmen Fernandez', '103 Riverbanks Center, Marikina City', '09173333333'],
      ['Rodriguez', 'Antonio Rodriguez', '104 Industrial Valley, Marikina City', '09174444444'],
      ['Mendoza', 'Elena Mendoza', '105 Concepcion Uno, Marikina City', '09175555555'],
      ['Torres', 'Miguel Torres', '106 Concepcion Dos, Marikina City', '09176666666'],
      ['Ramos', 'Luz Ramos', '107 Fortune St., Marikina City', '09177777777'],
      ['Flores', 'Eduardo Flores', '108 Greenheights Village, Marikina City', '09178888888'],
      ['Morales', 'Josefa Morales', '109 Parang Road, Marikina City', '09179999999'],
      ['Castillo', 'Fernando Castillo', '110 Jesus St., Marikina City', '09181111111'],
      ['Herrera', 'Rosa Herrera', '111 Malanday Road, Marikina City', '09182222222'],
      ['Jimenez', 'Carlos Jimenez', '112 Tumana Road, Marikina City', '09183333333'],
      ['Medina', 'Teresa Medina', '113 Gil Fernando Ave., Marikina City', '09184444444'],
      ['Ruiz', 'Pablo Ruiz', '114 Sumulong Highway, Marikina City', '09185555555'],
      ['Gutierrez', 'Nora Gutierrez', '115 A. Bonifacio St., Marikina City', '09186666666'],
      ['Ortega', 'Jose Ortega', '116 Shoe Ave., Marikina City', '09187777777'],
      ['Munoz', 'Esperanza Munoz', '117 JP Rizal St., Marikina City', '09188888888'],
      ['Alvarez', 'Ricardo Alvarez', '118 Katipunan St., Marikina City', '09189999999'],
      ['Romero', 'Corazon Romero', '119 Loyola St., Marikina City', '09191111111'],
      ['Vargas', 'Manuel Vargas', '120 Marcos Highway, Marikina City', '09192222222'],
      ['Castro', 'Milagros Castro', '121 Bayan-Bayanan Ave., Marikina City', '09193333333'],
      ['Guerrero', 'Arturo Guerrero', '122 IPI Road, Marikina City', '09194444444'],
      ['Aguilar', 'Remedios Aguilar', '123 MHAI Road, Marikina City', '09195555555'],
      ['Delgado', 'Ramon Delgado', '124 Nangka St., Marikina City', '09196666666'],
      ['Vega', 'Francisca Vega', '125 Mayor Gil Fernando Ave., Marikina City', '09197777777'],
      ['Santillan', 'Domingo Santillan', '126 Gen. Ordoñez St., Marikina City', '09198888888'],
      ['Pascual', 'Erlinda Pascual', '127 Mayor Chanyungco St., Marikina City', '09199999999'],
      ['Santiago', 'Benjamin Santiago', '128 Lilac St., Marikina City', '09201111111'],
      ['Bautista', 'Aida Bautista', '129 Gen. A. Luna St., Marikina City', '09202222222'],
      ['Navarro', 'Ernesto Navarro', '130 Burgos St., Marikina City', '09203333333'],
      ['Valdez', 'Lourdes Valdez', '131 Del Pilar St., Marikina City', '09204444444'],
      ['Salazar', 'Teodoro Salazar', '132 Mabini St., Marikina City', '09205555555'],
      ['Peña', 'Norma Peña', '133 Jacinto St., Marikina City', '09206666666'],
      ['Villanueva', 'Alfredo Villanueva', '134 Lopez Jaena St., Marikina City', '09207777777'],
      ['Cabrera', 'Imelda Cabrera', '135 Hernandez St., Marikina City', '09208888888'],
      ['Diaz', 'Armando Diaz', '136 Kalayaan Ave., Marikina City', '09209999999'],
      ['Miranda', 'Cecilia Miranda', '137 Road 1, Marikina City', '09211111111'],
      ['Molina', 'Gerardo Molina', '138 Road 2, Marikina City', '09212222222'],
      ['Serrano', 'Nenita Serrano', '139 Road 3, Marikina City', '09213333333'],
      ['Tolentino', 'Wilfredo Tolentino', '140 Road 4, Marikina City', '09214444444'],
      ['Espinoza', 'Virginia Espinoza', '141 Road 5, Marikina City', '09215555555'],
      ['Aquino', 'Oscar Aquino', '142 Road 6, Marikina City', '09216666666'],
      ['Villena', 'Priscilla Villena', '143 Road 7, Marikina City', '09217777777'],
      ['Cortez', 'Rolando Cortez', '144 Road 8, Marikina City', '09218888888'],
      ['Robles', 'Teresita Robles', '145 Road 9, Marikina City', '09219999999']
    ];
    
    console.log(`\n➕ Adding ${additionalFamilies.length} more families...`);
    
    let addedCount = 0;
    for (const family of additionalFamilies) {
      try {
        await connection.execute(`
          INSERT INTO Families (familyName, surname, headOfFamily, address, contactNumber, isActive)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [family[0] + ' Family', family[0], family[1], family[2], family[3], 1]);
        addedCount++;
      } catch (error) {
        console.error(`❌ Error adding ${family[0]} family:`, error.message);
      }
    }
    
    console.log(`✅ Successfully added ${addedCount} families!`);
    
    // Check final count
    const [finalCountResult] = await connection.execute('SELECT COUNT(*) as count FROM Families');
    const finalCount = finalCountResult[0].count;
    console.log(`📊 Total families now: ${finalCount}`);
    
    // Show active vs inactive breakdown
    const [statusBreakdown] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN isActive = 1 THEN 1 END) as active,
        COUNT(CASE WHEN isActive = 0 THEN 1 END) as inactive
      FROM Families
    `);
    
    console.log(`📈 Family Status Breakdown:`);
    console.log(`   Total: ${statusBreakdown[0].total}`);
    console.log(`   Active: ${statusBreakdown[0].active}`);
    console.log(`   Inactive: ${statusBreakdown[0].inactive}`);
    
    console.log('\n🎉 Database update completed successfully!');
    console.log('💡 Refresh your dashboard to see the updated family count.');
    
  } catch (error) {
    console.error('❌ Error adding families:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
};

// Run the script
if (require.main === module) {
  console.log('🏥 HRSM 2.0 - Add More Families');
  console.log('===============================');
  console.log('➕ Adding 45 additional families to the database...');
  console.log('');
  
  addMoreFamilies().catch(console.error);
}

module.exports = { addMoreFamilies };
