import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

export const generateReceipt = (payment, student) => {
  const doc = new jsPDF()
  
  // School Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SCHOOL MANAGEMENT SYSTEM', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Fee Payment Receipt', 105, 28, { align: 'center' })
  
  // Receipt Details Box
  doc.setDrawColor(0)
  doc.setFillColor(240, 240, 240)
  doc.rect(15, 35, 180, 25, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Receipt #: ${payment.payment_id}`, 20, 43)
  doc.text(`Date: ${format(new Date(payment.payment_date || new Date()), 'MMM dd, yyyy')}`, 140, 43)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: ${payment.payment_method || 'Cash'}`, 20, 50)
  doc.text(`Time: ${format(new Date(), 'hh:mm a')}`, 140, 50)
  
  // Student Information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Student Information', 15, 70)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Name: ${student.first_name} ${student.last_name}`, 20, 78)
  doc.text(`Student ID: ${student.admission_number || student.student_id}`, 20, 85)
  doc.text(`Class: ${student.class_name || 'N/A'} - ${student.section_name || 'N/A'}`, 20, 92)
  
  // Payment Details Table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Payment Details', 15, 105)
  
  const tableData = []
  
  if (payment.installment_payments && payment.installment_payments.length > 0) {
    payment.installment_payments.forEach((inst) => {
      tableData.push([
        inst.installment_name || 'Installment',
      inst.fee_type_name || 'Fee',
      `₹${parseFloat(inst.amount_paid || 0).toFixed(2)}`
    ])
  })
} else {
  tableData.push([
    'Payment',
    'Fee Payment',
    `₹${parseFloat(payment.amount_paid || 0).toFixed(2)}`
  ])
}

doc.autoTable({
  startY: 110,
  head: [['Description', 'Fee Type', 'Amount']],
  body: tableData,
  theme: 'striped',
  headStyles: { fillColor: [66, 66, 66] },
  margin: { left: 15, right: 15 },
})

// Total Amount Box
const finalY = doc.lastAutoTable.finalY || 150
doc.setDrawColor(0)
doc.setFillColor(220, 220, 220)
doc.rect(120, finalY + 10, 75, 15, 'F')

doc.setFont('helvetica', 'bold')
doc.setFontSize(12)
doc.text('Total Amount Paid:', 125, finalY + 18)
doc.text(`₹${parseFloat(payment.amount_paid || 0).toFixed(2)}`, 175, finalY + 18, { align: 'right' })
  
  // Footer
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text('Thank you for your payment!', 105, finalY + 40, { align: 'center' })
  doc.text('This is a computer-generated receipt.', 105, finalY + 46, { align: 'center' })
  
  // Signature Line
  doc.setFont('helvetica', 'normal')
  doc.line(140, finalY + 65, 190, finalY + 65)
  doc.text('Authorized Signature', 165, finalY + 70, { align: 'center' })
  
  // Save PDF
  const fileName = `Receipt_${payment.payment_id}_${student.first_name}_${student.last_name}_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}
