export default function AttendanceToggle({ checked, onChange, labelLeft = 'Absent', labelRight = 'Present', disabled = false }) {
  return (
    <label
      className={`inline-flex items-center relative select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={!!checked}
        onChange={disabled ? () => {} : onChange}
        disabled={disabled}
      />
      <div className="w-24 h-8 bg-red-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-11 after:transition-all peer-checked:bg-green-100 shadow-sm"></div>
      <span className="absolute left-3 text-xs font-bold text-red-600 peer-checked:hidden">{labelLeft}</span>
      <span className="absolute right-3 text-xs font-bold text-green-600 hidden peer-checked:block">{labelRight}</span>
    </label>
  )
}
