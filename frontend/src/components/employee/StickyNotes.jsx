import { useState, useEffect } from "react";
import { getNotes, createNote, updateNote, deleteNote, togglePinNote } from "../../services/api";
import { Plus, X, Edit2, Pin, Check, Trash2, StickyNote } from "lucide-react";

const COLORS = [
  { name: "yellow", bg: "bg-yellow-100", border: "border-yellow-300", hover: "hover:bg-yellow-200" },
  { name: "blue", bg: "bg-blue-100", border: "border-blue-300", hover: "hover:bg-blue-200" },
  { name: "green", bg: "bg-green-100", border: "border-green-300", hover: "hover:bg-green-200" },
  { name: "pink", bg: "bg-pink-100", border: "border-pink-300", hover: "hover:bg-pink-200" },
  { name: "purple", bg: "bg-purple-100", border: "border-purple-300", hover: "hover:bg-purple-200" },
];

export default function StickyNotes() {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", color: "yellow" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await getNotes();
      setNotes(response.data || []);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newNote.content.trim()) return;

    try {
      const response = await createNote(newNote);
      setNotes([response.data.note, ...notes]);
      setNewNote({ title: "", content: "", color: "yellow" });
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleUpdate = async (noteId, updatedData) => {
    try {
      const response = await updateNote(noteId, updatedData);
      setNotes(notes.map(note => note.id === noteId ? response.data.note : note));
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm("Delete this note?")) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleTogglePin = async (noteId) => {
    try {
      const response = await togglePinNote(noteId);
      setNotes(notes.map(note => 
        note.id === noteId ? { ...note, is_pinned: response.data.is_pinned } : note
      ));
      loadNotes();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const getColorClasses = (colorName) => {
    return COLORS.find(c => c.name === colorName) || COLORS[0];
  };

  if (loading) {
    return (
      <div className="task-list-card">
        <div className="task-list-header">
          <h2 className="task-list-title">📝 My Sticky Notes</h2>
        </div>
        <div className="task-list-body">
          <div className="flex justify-center items-center h-32">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-card">
      {/* Header - Universal Structure */}
      <div className="task-list-header">
        <h2 className="task-list-title">📝 My Sticky Notes</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Note
        </button>
      </div>

      {/* Body - Universal Structure */}
      <div className="task-list-body">
        {/* Create Note Form */}
        {isCreating && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">Create New Note</h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: "", content: "", color: "yellow" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Title (optional)"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="input input-sm w-full mb-2"
            />
            <textarea
              placeholder="Write your note..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="input w-full mb-2 min-h-[80px] resize-none"
              rows="3"
              autoFocus
            />
            
            {/* Color Picker */}
            <div className="mb-3">
              <label className="text-sm text-gray-600 mb-2 block">Choose Color:</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setNewNote({ ...newNote, color: color.name })}
                    className={`w-8 h-8 rounded-lg ${color.bg} ${color.border} border-2 transition-all ${
                      newNote.color === color.name ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn btn-success btn-sm">
                <Check className="w-4 h-4 mr-1" />
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: "", content: "", color: "yellow" });
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {notes.length === 0 ? (
          <div className="task-list-empty">
            <StickyNote className="task-list-empty-icon" />
            <p className="task-list-empty-text">No sticky notes yet</p>
            <p className="text-sm text-gray-500 mt-2">Create your first sticky note to get started!</p>
          </div>
        ) : (
          /* Notes Masonry Layout - YOUR EXACT STRUCTURE */
          <div 
            className="masonry-grid"
            style={{
              columnCount: 'auto',
              columnFill: 'balance',
              columnGap: '1rem',
              columnWidth: '250px'
            }}
          >
            {notes.map((note) => {
              const colorClasses = getColorClasses(note.color);
              const isEditing = editingId === note.id;

              return (
                <div
                  key={note.id}
                  className="masonry-item"
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '1rem',
                    pageBreakInside: 'avoid'
                  }}
                >
                  <div
                    className={`relative p-4 rounded-lg border-2 ${colorClasses.bg} ${colorClasses.border} shadow-md ${colorClasses.hover} transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                  >
                    {/* Pin Badge */}
                    {note.is_pinned && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg">
                        <Pin className="w-3 h-3 fill-white" />
                      </div>
                    )}

                    {/* Note Content */}
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          defaultValue={note.title}
                          onBlur={(e) => handleUpdate(note.id, { title: e.target.value })}
                          className="input input-sm w-full mb-2 bg-white"
                          placeholder="Title"
                        />
                        <textarea
                          defaultValue={note.content}
                          onBlur={(e) => handleUpdate(note.id, { content: e.target.value })}
                          className="input w-full mb-2 bg-white min-h-[80px] resize-none"
                          rows="3"
                        />
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-success btn-sm w-full"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Done
                        </button>
                      </div>
                    ) : (
                      <>
                        {note.title && (
                          <h3 className="font-bold text-gray-900 mb-2 text-base border-b border-gray-300 pb-2 break-words">
                            {note.title}
                          </h3>
                        )}
                        <p className="text-gray-800 text-sm whitespace-pre-wrap mb-4 leading-relaxed break-words overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {note.content}
                        </p>
                        
                        {/* Timestamp */}
                        <div className="text-xs text-gray-600 mb-3 italic border-t border-gray-300 pt-2">
                          {new Date(note.updated_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setEditingId(note.id)}
                            className="btn btn-sm btn-secondary flex-1"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleTogglePin(note.id)}
                            className={`btn btn-sm flex-1 ${
                              note.is_pinned 
                                ? "bg-red-500 hover:bg-red-600 text-white border-red-600" 
                                : "btn-secondary"
                            }`}
                            title={note.is_pinned ? "Unpin" : "Pin"}
                          >
                            <Pin className="w-3 h-3 mr-1" />
                            {note.is_pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="btn btn-sm btn-danger"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}