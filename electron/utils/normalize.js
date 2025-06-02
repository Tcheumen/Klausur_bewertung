const normalizeData = (students) => {
  return students.map((student) => {
    
    if (typeof student === 'object' && Object.keys(student).length === 1) {
      const [key, value] = Object.entries(student)[0];
      if (key.includes(';')) {
        const keys = key.split(';');
        const values = value.split(';');

        return {
          mtknr: values[keys.indexOf('mtknr')] || '',
          nachname: values[keys.indexOf('nachname')] || '',
          vorname: values[keys.indexOf('vorname')] || '',
          pversuch: values[keys.indexOf('pversuch')] || '',
          pvermerk: values[keys.indexOf('pvermerk')] || '',
          sitzplatz: values[keys.indexOf('sitzplatz')] || ''
          
        };
      }
    }

    return student;
  });
};

module.exports = { normalizeData };