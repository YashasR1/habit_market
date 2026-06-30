import { useState, useEffect } from "react";
import { LayoutAnimation } from "react-native";

export const usePodEditor = (
  notes: any[],
  addNote: any,
  updateNote: any,
  deleteNote: any,
  activeCategory: string,
  setActiveCategory: any,
  setIsSidebarOpen: any,
  width: number,
) => {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorType, setEditorType] = useState("note");
  const [isCreating, setIsCreating] = useState(false);

  // Re-sync selectedNote whenever notes updates (e.g. after addNoteMedia)
  useEffect(() => {
    if (selectedNote?.id) {
      const updated = notes.find((n: any) => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [notes, selectedNote?.id]);

  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorType(note.type);
    setIsCreating(false);
    setActiveCategory(note.type || "all");
    if (width < 768) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSidebarOpen(false);
    }
  };

  const handleCreateNew = () => {
    // Logic: If active category is a folder in Library, add note there.
    // If 'all', add to 'note' (Daily) by default.
    const newType =
      activeCategory === "all" ? "note" : activeCategory;

    setIsCreating(true);
    setSelectedNote(null);
    setEditorTitle("");
    setEditorContent("");
    setEditorType(newType);
    if (width < 768) setIsSidebarOpen(false);
  };

  const handleSave = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, {
        title: editorTitle,
        content: editorContent,
        type: editorType,
      });
    } else {
      addNote(editorTitle, editorContent, editorType);
      setIsCreating(false);
    }
  };

  const handleDelete = () => {
    if (selectedNote) {
      deleteNote(selectedNote.id);
      setSelectedNote(null);
      if (width < 768) setIsSidebarOpen(true);
    }
  };

  return {
    selectedNote,
    setSelectedNote,
    editorTitle,
    setEditorTitle,
    editorContent,
    setEditorContent,
    editorType,
    setEditorType,
    isCreating,
    setIsCreating,
    handleSelectNote,
    handleCreateNew,
    handleSave,
    handleDelete,
  };
};
