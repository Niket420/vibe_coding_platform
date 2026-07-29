"use client";

type SaveDialogProps = {
  fileName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export default function SaveDialog({
  fileName,
  onSave,
  onDiscard,
  onCancel,
}: SaveDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-md bg-[#252526] border border-zinc-700 shadow-2xl">
        <div className="px-6 py-5">
          <h2 className="text-white text-lg font-medium">
            Do you want to save your changes?
          </h2>

          <p className="mt-3 text-sm text-zinc-400">
            Your changes to{" "}
            <span className="text-white">{fileName}</span> will
            be lost if you don't save them.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-700 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </button>

          <button
            onClick={onDiscard}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
          >
            Don't Save
          </button>

          <button
            onClick={onSave}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}