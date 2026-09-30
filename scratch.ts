const data = { barcode: '', categoryId: '' };
const result = {
    barcode: (data.barcode && data.barcode !== 'undefined' && data.barcode !== 'null' && data.barcode !== '') ? data.barcode : undefined,
    category_id: data.categoryId && data.categoryId !== 'undefined' && data.categoryId !== 'null' && data.categoryId !== '' ? data.categoryId : undefined
};
console.log(result);
