"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();

  // ✅ Get logged-in user data from Redux store
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [editableUser, setEditableUser] = useState(user || null);

  useEffect(() => {
    setEditableUser(user);
    console.log("🔐 Logged-in user data:", user);
  }, [user]);

  const handleSave = () => {
    console.log("Saving updated user info:", editableUser);
    closeModal();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No user data found. Please sign in.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Left side */}
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                width={80}
                height={80}
                src={user.profilePictureUrl || "/images/user/owner.jpg"}
                alt={user.name || "User"}
              />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                {user.name} {user.surname}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.role || "User"}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              {user.phone && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {user.phone}
                </p>
              )}
              {user.department && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Department: {user.department}
                </p>
              )}
              {user.position && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Position: {user.position}
                </p>
              )}
              {user.address && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Address: {user.address}
                </p>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit User Information
          </h4>

          <form className="space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input
                  type="text"
                  defaultValue={user.name}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  defaultValue={user.surname}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      surname: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="text"
                  defaultValue={user.email}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  defaultValue={user.phone}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  type="text"
                  defaultValue={user.department}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  type="text"
                  defaultValue={user.position}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  type="text"
                  defaultValue={user.address}
                  onChange={(e) =>
                    setEditableUser((prev: any) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
