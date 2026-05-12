import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BookOpen, BookPlus, ListOrdered, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EditButton, DeleteButton, ActionButtonGroup } from '../components/ui/ActionButtons.jsx';
import { academicService } from '../services/academicService';
import studentService from '../services/studentService';
import subjectService from '../services/subjectService';
import syllabusBookService from '../services/syllabusBookService';
import { PERMISSIONS } from '../config/permissions';

const SyllabusDivision = ({ campusId, academicYears, subjects, formData, setFormData, canViewCourse, canCreateCourse, canEditCourse, canDeleteCourse }) => {
  const [divisionTab, setDivisionTab] = useState(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [bookView, setBookView] = useState('list'); // 'list' | 'create' | 'edit'
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookActionLoading, setBookActionLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [editingBookKey, setEditingBookKey] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (divisionTab !== 'book') {
      setBookView('list');
      setEditingBookKey(null);
    }
  }, [divisionTab]);

  useEffect(() => {
    const academicYearId = String(formData.academic_year_id || '').trim();
    if (!academicYearId) {
      setSelectedCurriculumId(null);
      return;
    }

    const selectedYear =
      academicYears.find((y) => String(y.academic_year_id) === academicYearId) || null;

    const inlineCurriculumId = selectedYear?.curriculum_id ?? selectedYear?.curriculumId ?? null;
    if (inlineCurriculumId) {
      setSelectedCurriculumId(String(inlineCurriculumId));
      return;
    }

    const fetchAcademicYearDetails = async () => {
      if (!campusId) {
        setSelectedCurriculumId(null);
        return;
      }
      try {
        const res = await academicService.getAcademicYearById(campusId, academicYearId);
        const ay = res?.data || res;
        const cid = ay?.curriculum_id ?? ay?.curriculumId ?? null;
        setSelectedCurriculumId(cid ? String(cid) : null);
      } catch (error) {
        console.error('Error fetching academic year details:', error);
        setSelectedCurriculumId(null);
      }
    };

    fetchAcademicYearDetails();
  }, [academicYears, campusId, formData.academic_year_id]);

  const filteredSubjects = useMemo(() => {
    if (!selectedCurriculumId) return subjects;
    return (subjects || []).filter((s) => {
      const cid = s?.curriculum_id ?? s?.curriculumId ?? null;
      return cid !== null && String(cid) === String(selectedCurriculumId);
    });
  }, [subjects, selectedCurriculumId]);

  useEffect(() => {
    const subjectId = String(formData.subject_id || '').trim();
    if (!subjectId) return;
    const exists = filteredSubjects.some((s) => String(s.subject_id) === subjectId);
    if (!exists) {
      setFormData((prev) => ({ ...prev, subject_id: '' }));
    }
  }, [filteredSubjects, formData.subject_id, setFormData]);

  const selectedSubjectName = useMemo(() => {
    const subjectId = String(formData.subject_id || '').trim();
    if (!subjectId) return '';
    const s = (subjects || []).find((x) => String(x.subject_id) === subjectId);
    return String(s?.subject_name || '').trim();
  }, [subjects, formData.subject_id]);

  const fetchBooks = async () => {
    const academicYearIdStr = String(formData.academic_year_id || '').trim();
    if (!academicYearIdStr) {
      setBooks([]);
      return;
    }
    const academicYearId = Number.parseInt(academicYearIdStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      setBooks([]);
      return;
    }

    try {
      setBooksLoading(true);
      const response = await syllabusBookService.getBooks({ academic_year_id: academicYearId });
      const rows = response?.data?.books || response?.data || response?.books || [];
      setBooks(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error(error?.message || 'Failed to load books');
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    if (divisionTab !== 'book') return;
    if (bookView !== 'list') return;
    if (!canViewCourse) return;
    fetchBooks();
  }, [divisionTab, bookView, formData.academic_year_id, canViewCourse]);

  const startCreateBook = () => {
    setEditingBookKey(null);
    setFormData((prev) => ({
      ...prev,
      subject_id: '',
      book_name: '',
      version: ''
    }));
    setBookView('create');
  };

  const startEditBook = (book) => {
    const academicYearId = book?.academic_year_id ?? book?.academicYearId ?? null;
    const subjectName = String(book?.subject_name ?? book?.subjectName ?? '').trim();
    const versionNo = book?.version_no ?? book?.versionNo ?? book?.version ?? null;

    if (!academicYearId || !subjectName || !versionNo) {
      toast.error('Invalid book key');
      return;
    }

    const matchedSubject =
      (subjects || []).find((s) => String(s?.subject_name || '').trim() === subjectName) || null;

    setEditingBookKey({
      academicYearId: Number.parseInt(String(academicYearId), 10),
      subjectName,
      versionNo: Number.parseInt(String(versionNo), 10)
    });

    setFormData((prev) => ({
      ...prev,
      academic_year_id: String(academicYearId),
      subject_id: matchedSubject ? String(matchedSubject.subject_id) : '',
      book_name: String(book?.book_name ?? book?.bookName ?? '').trim(),
      version: String(versionNo)
    }));

    setBookView('edit');
  };

  const validateCreateBook = () => {
    const academicYearIdStr = String(formData.academic_year_id || '').trim();
    const academicYearId = Number.parseInt(academicYearIdStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      toast.error('Please select Academic Year');
      return null;
    }
    if (!String(formData.subject_id || '').trim() || !selectedSubjectName) {
      toast.error('Please select Subject Name');
      return null;
    }
    const bookName = String(formData.book_name || '').trim();
    if (!bookName) {
      toast.error('Please enter Book Name');
      return null;
    }
    const versionStr = String(formData.version ?? '').trim();
    const versionNo = versionStr ? Number.parseInt(versionStr, 10) : undefined;
    if (versionStr && (!Number.isInteger(versionNo) || versionNo < 1)) {
      toast.error('Version must be an integer >= 1');
      return null;
    }
    return { academicYearId, subjectName: selectedSubjectName, bookName, versionNo };
  };

  const handleCreateBook = async () => {
    if (!canCreateCourse) {
      toast.error('You do not have permission to add books');
      return;
    }
    const v = validateCreateBook();
    if (!v) return;

    try {
      setBookActionLoading(true);
      const payload = {
        academic_year_id: v.academicYearId,
        subject_name: v.subjectName,
        book_name: v.bookName,
        version_no: v.versionNo
      };
      const response = await syllabusBookService.createBook(payload);
      if (response?.success) {
        toast.success(response?.message || 'Book created successfully');
        setBookView('list');
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error(error?.message || 'Failed to create book');
    } finally {
      setBookActionLoading(false);
    }
  };

  const handleUpdateBook = async () => {
    if (!canEditCourse) {
      toast.error('You do not have permission to edit books');
      return;
    }
    if (!editingBookKey) {
      toast.error('No book selected for edit');
      return;
    }
    const bookName = String(formData.book_name || '').trim();
    if (!bookName) {
      toast.error('Please enter Book Name');
      return;
    }

    try {
      setBookActionLoading(true);
      const response = await syllabusBookService.updateBookByKey(
        editingBookKey.academicYearId,
        editingBookKey.subjectName,
        editingBookKey.versionNo,
        { book_name: bookName }
      );
      if (response?.success) {
        toast.success(response?.message || 'Book updated successfully');
        setBookView('list');
        setEditingBookKey(null);
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error(error?.message || 'Failed to update book');
    } finally {
      setBookActionLoading(false);
    }
  };

  const handleDeleteBook = async (book) => {
    if (!canDeleteCourse) {
      toast.error('You do not have permission to delete books');
      return;
    }

    const academicYearId = book?.academic_year_id ?? book?.academicYearId ?? null;
    const subjectName = String(book?.subject_name ?? book?.subjectName ?? '').trim();
    const versionNo = book?.version_no ?? book?.versionNo ?? book?.version ?? null;

    if (!academicYearId || !subjectName || !versionNo) {
      toast.error('Invalid book key');
      return;
    }

    try {
      setBookActionLoading(true);
      const response = await syllabusBookService.deleteBookByKey(
        Number.parseInt(String(academicYearId), 10),
        subjectName,
        Number.parseInt(String(versionNo), 10)
      );
      if (response?.success) {
        toast.success(response?.message || 'Book deleted successfully');
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error(error?.message || 'Failed to delete book');
    } finally {
      setBookActionLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-4 md:p-6">
        {divisionTab === null ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Syllabus Division</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <Card hover onClick={() => setDivisionTab('book')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <BookPlus className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Add Book</h2>
                  <p className="text-secondary-600">Add syllabus book details</p>
                </div>
              </Card>

              <Card hover onClick={() => setDivisionTab('chapters')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <ListOrdered className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Add Chapters</h2>
                  <p className="text-secondary-600">Add chapters for the selected book</p>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {divisionTab === 'book' ? 'Add Book' : 'Add Chapters'}
              </h2>
              <button type="button" onClick={() => setDivisionTab(null)} className="btn-secondary">
                Back
              </button>
            </div>

            {divisionTab === 'book' ? (
              <>
                {bookView === 'list' ? (
                  <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-secondary-900">Books</h2>
                        <p className="text-secondary-600 text-sm font-medium">
                          Select an academic year to view syllabus books
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {canCreateCourse && (
                          <button
                            type="button"
                            onClick={startCreateBook}
                            className="btn-primary w-full sm:w-auto justify-center"
                            disabled={bookActionLoading}
                          >
                            Add Book
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                          <select
                            name="academic_year_id"
                            value={formData.academic_year_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Academic Year</option>
                            {academicYears.map((year) => (
                              <option key={year.academic_year_id} value={String(year.academic_year_id)}>
                                {year.year_name} - {year.curriculum_code} - {year.medium}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        {!canViewCourse ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">Access Restricted</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              You do not have permission to view books.
                            </p>
                          </div>
                        ) : booksLoading ? (
                          <div className="flex justify-center items-center py-12">
                            <LoadingSpinner className="w-8 h-8" />
                            <span className="ml-2 text-gray-500">Loading books...</span>
                          </div>
                        ) : !String(formData.academic_year_id || '').trim() ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">Select an academic year</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              Choose an academic year to list syllabus books.
                            </p>
                          </div>
                        ) : books.length === 0 ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">No books found</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              No syllabus books exist for this academic year.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-secondary-200">
                              <thead className="bg-secondary-50/50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Subject
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Book
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Version
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  {(canEditCourse || canDeleteCourse) && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-secondary-200">
                                {books.map((b, idx) => {
                                  const subjectName = String(b?.subject_name ?? b?.subjectName ?? '').trim();
                                  const bookName = String(b?.book_name ?? b?.bookName ?? '').trim();
                                  const versionNo = b?.version_no ?? b?.versionNo ?? b?.version ?? '';
                                  const isActive = b?.is_active ?? b?.isActive;

                                  return (
                                    <tr key={`${subjectName}-${versionNo}-${idx}`} className="hover:bg-secondary-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                        {subjectName || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                        {bookName || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                        {versionNo || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                            isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                          }`}
                                        >
                                          {isActive === false ? 'Inactive' : 'Active'}
                                        </span>
                                      </td>
                                      {(canEditCourse || canDeleteCourse) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <ActionButtonGroup>
                                            {canEditCourse && (
                                              <EditButton onClick={() => startEditBook(b)} title="Edit book" />
                                            )}
                                            {canDeleteCourse && (
                                              <DeleteButton
                                                onClick={() => handleDeleteBook(b)}
                                                title="Delete book"
                                                confirmMessage={`Are you sure you want to delete ${subjectName || 'this book'} (v${versionNo || ''})?`}
                                                disabled={bookActionLoading}
                                              />
                                            )}
                                          </ActionButtonGroup>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl">
                    <Card>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <h2 className="text-xl font-bold text-secondary-900">
                            {bookView === 'create' ? 'Add New Book' : 'Edit Book'}
                          </h2>
                          <button
                            type="button"
                            onClick={() => {
                              setBookView('list');
                              setEditingBookKey(null);
                            }}
                            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to List
                          </button>
                        </div>

                        {bookActionLoading && (
                          <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                            <div className="flex items-center">
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                              <p className="text-sm text-primary-700">
                                {bookView === 'create' ? 'Creating book...' : 'Updating book...'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <select
                              name="academic_year_id"
                              value={formData.academic_year_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={bookView === 'edit'}
                            >
                              <option value="">Select Academic Year</option>
                              {academicYears.map((year) => (
                                <option key={year.academic_year_id} value={String(year.academic_year_id)}>
                                  {year.year_name} - {year.curriculum_code} - {year.medium}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                            <select
                              name="subject_id"
                              value={formData.subject_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={bookView === 'edit'}
                            >
                              <option value="">Select Subject</option>
                              {filteredSubjects.map((sub) => (
                                <option key={sub.subject_id} value={String(sub.subject_id)}>
                                  {sub.subject_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Book Name</label>
                            <input
                              type="text"
                              name="book_name"
                              value={formData.book_name}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter book name"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Version No {bookView === 'edit' ? '' : '(Optional)'}
                            </label>
                            <input
                              type="number"
                              name="version"
                              value={formData.version}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={1}
                              step={1}
                              placeholder="1"
                              disabled={bookView === 'edit'}
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {bookView === 'create' ? (
                            <button type="button" className="btn-primary" onClick={handleCreateBook} disabled={bookActionLoading}>
                              Add Book
                            </button>
                          ) : (
                            <button type="button" className="btn-primary" onClick={handleUpdateBook} disabled={bookActionLoading}>
                              Update Book
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-secondary-200 rounded-xl p-6 bg-secondary-50/30">
                <div className="text-sm text-secondary-700">
                  Select academic year, subject, book name and version in Add Book tab first.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const SyllabusProgress = ({ academicYears, subjects, formData }) => {
  const selectedAcademicYear = useMemo(() => {
    if (!formData.academic_year_id) return null;
    return academicYears.find((y) => String(y.academic_year_id) === String(formData.academic_year_id)) || null;
  }, [academicYears, formData.academic_year_id]);

  const selectedSubject = useMemo(() => {
    if (!formData.subject_id) return null;
    return subjects.find((s) => String(s.subject_id) === String(formData.subject_id)) || null;
  }, [subjects, formData.subject_id]);

  return (
    <Card>
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Syllabus Progress</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-1">Selected</div>
            <div className="text-sm text-gray-800">
              {(selectedAcademicYear && `${selectedAcademicYear.year_name} (${selectedAcademicYear.curriculum_code} - ${selectedAcademicYear.medium})`) || 'Academic Year: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {(selectedSubject && `Subject: ${selectedSubject.subject_name}`) || 'Subject: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {formData.book_name ? `Book: ${formData.book_name}` : 'Book: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {String(formData.version ?? '').trim() !== '' ? `Version: ${formData.version}` : 'Version: —'}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Progress</div>
            <div className="text-sm text-gray-600">Select academic year and subject to view syllabus progress.</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function SyllabusPage() {
  const { getCampusId, getCampusName, getDefaultAcademicYearId, hasPermission } = useAuth();
  const campusId = getCampusId();
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  const [formData, setFormData] = useState({
    academic_year_id: '',
    subject_id: '',
    book_name: '',
    version: ''
  });

  const canCreateCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_CREATE);
  const canEditCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_EDIT);
  const canDeleteCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_DELETE);
  const canViewCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_LIST_READ);

  const renderAccessDenied = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-secondary-900 mb-2">Access Restricted</h3>
          <p className="text-secondary-600 mb-4">
            You do not have permission to access syllabus books. Only users with syllabus book permissions can view or manage books.
          </p>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const defAy = getDefaultAcademicYearId();
    if (defAy && String(formData.academic_year_id || '') === '') {
      setFormData((prev) => ({ ...prev, academic_year_id: String(defAy) }));
    }
  }, [getDefaultAcademicYearId, formData.academic_year_id]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        if (!canViewCourse && !canCreateCourse && !canEditCourse && !canDeleteCourse) {
          setAcademicYears([]);
          setSubjects([]);
          return;
        }

        const campusId = getCampusId();
        if (!campusId) {
          setAcademicYears([]);
          setSubjects([]);
          return;
        }

        setLoading(true);

        const [ayRes, subjectRes] = await Promise.all([
          studentService.getFilterOptions(),
          subjectService.getAllSubjects(campusId)
        ]);

        if (ayRes?.success) {
          setAcademicYears(ayRes.data?.academic_years || []);
        } else {
          setAcademicYears([]);
        }

        if (subjectRes?.success) {
          setSubjects(subjectRes.data?.subjects || []);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error loading syllabus dropdowns:', error);
        toast.error(error?.message || 'Failed to load dropdown values');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdowns();
  }, [getCampusId, canViewCourse, canCreateCourse, canEditCourse, canDeleteCourse]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Syllabus</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Campus: {getCampusName()}</p>
        </div>
      </div>

      {!canViewCourse && !canCreateCourse && !canEditCourse && !canDeleteCourse ? (
        renderAccessDenied()
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {activeTab === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <Card hover onClick={() => setActiveTab('division')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Division</h2>
                  <p className="text-secondary-600">Academic year, subject, book name, and version</p>
                </div>
              </Card>

              <Card hover onClick={() => setActiveTab('progress')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Progress</h2>
                  <p className="text-secondary-600">Track progress for the selected syllabus</p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-w-4xl">
                <button type="button" onClick={() => setActiveTab(null)} className="btn-secondary">
                  Back
                </button>
              </div>
              {activeTab === 'division' ? (
                <SyllabusDivision
                  campusId={campusId}
                  academicYears={academicYears}
                  subjects={subjects}
                  formData={formData}
                  setFormData={setFormData}
                  canViewCourse={canViewCourse}
                  canCreateCourse={canCreateCourse}
                  canEditCourse={canEditCourse}
                  canDeleteCourse={canDeleteCourse}
                />
              ) : (
                <SyllabusProgress academicYears={academicYears} subjects={subjects} formData={formData} />
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
