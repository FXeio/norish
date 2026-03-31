"use client";

import { useState } from "react";
import { PlusIcon, ShieldCheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import NewFeatureChip from "../../components/new-feature-chip";

import { parseJsonCookies, parseNetscapeCookies } from "@/lib/cookie-parsers";
import { showSafeErrorToast } from "@/lib/ui/safe-error-toast";
import { useTRPC } from "@/app/providers/trpc-provider";

type FormType = "header" | "cookie" | "netscape" | "json";

export default function SiteAuthTokensCard() {
  const t = useTranslations("settings.user.siteAuthTokens");
  const tErrors = useTranslations("common.errors");
  const tActions = useTranslations("common.actions");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Query
  const listQueryOptions = trpc.siteAuthTokens.list.queryOptions();
  const { data: tokens = [] } = useQuery(listQueryOptions);

  // Mutations
  const createMutation = useMutation(trpc.siteAuthTokens.create.mutationOptions());
  const removeMutation = useMutation(trpc.siteAuthTokens.remove.mutationOptions());
  const bulkCreateMutation = useMutation(trpc.siteAuthTokens.bulkCreate.mutationOptions());
  const bulkDeleteMutation = useMutation(trpc.siteAuthTokens.bulkDelete.mutationOptions());

  // Form state
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<FormType>("header");
  const [bulkText, setBulkText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tokens.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tokens.map((t) => t.id)));
    }
  };

  const handleCreate = async () => {
    if (!domain.trim() || !name.trim() || !value.trim()) return;

    setIsCreating(true);
    try {
      const newToken = await createMutation.mutateAsync({ domain, name, value, type: type as "header" | "cookie" });

      queryClient.setQueryData(listQueryOptions.queryKey, (prev: typeof tokens | undefined) =>
        prev ? [...prev, newToken] : [newToken]
      );

      setDomain("");
      setName("");
      setValue("");
      setType("header");
    } catch (error) {
      showSafeErrorToast({
        title: tErrors("operationFailed"),
        description: tErrors("technicalDetails"),
        color: "danger",
        error,
        context: "site-auth-tokens:create",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkText.trim()) return;

    setIsCreating(true);
    try {
      const cookies = type === "netscape"
        ? parseNetscapeCookies(bulkText)
        : parseJsonCookies(bulkText);

      if (cookies.length === 0) {
        showSafeErrorToast({
          title: tErrors("operationFailed"),
          description: tErrors("technicalDetails"),
          color: "danger",
          error: new Error("Empty parse result"),
          context: "site-auth-tokens:bulk-create",
        });
        return;
      }

      const newTokens = await bulkCreateMutation.mutateAsync(cookies);

      queryClient.setQueryData(listQueryOptions.queryKey, (prev: typeof tokens | undefined) =>
        prev ? [...prev, ...newTokens] : newTokens
      );

      setBulkText("");
      setType("header");
    } catch (error) {
      showSafeErrorToast({
        title: tErrors("operationFailed"),
        description: tErrors("technicalDetails"),
        color: "danger",
        error,
        context: "site-auth-tokens:bulk-create",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (tokenId: string) => {
    try {
      await removeMutation.mutateAsync({ id: tokenId });

      queryClient.setQueryData(listQueryOptions.queryKey, (prev: typeof tokens | undefined) =>
        prev ? prev.filter((t) => t.id !== tokenId) : prev
      );
    } catch (error) {
      showSafeErrorToast({
        title: tErrors("operationFailed"),
        description: tErrors("technicalDetails"),
        color: "danger",
        error,
        context: "site-auth-tokens:delete",
      });
    } finally {
      setShowDeleteModal(false);
      setTokenToDelete(null);
      setSelectedIds((prev) => {
        if (!tokenToDelete) return prev;
        const next = new Set(prev);

        next.delete(tokenToDelete);

        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync({ ids: Array.from(selectedIds) });

      queryClient.setQueryData(listQueryOptions.queryKey, (prev: typeof tokens | undefined) =>
        prev ? prev.filter((t) => !selectedIds.has(t.id)) : prev
      );

      setSelectedIds(new Set());
    } catch (error) {
      showSafeErrorToast({
        title: tErrors("operationFailed"),
        description: tErrors("technicalDetails"),
        color: "danger",
        error,
        context: "site-auth-tokens:bulk-delete",
      });
    }
  };

  const isBulkMode = type === "netscape" || type === "json";
  const isFormValid = isBulkMode
    ? bulkText.trim().length > 0
    : domain.trim() && name.trim() && value.trim();

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheckIcon className="h-5 w-5" />
            {t("title")}
            <NewFeatureChip />
          </h2>
        </CardHeader>
        <CardBody className="gap-4">
          <p className="text-default-600 text-base">{t("description")}</p>

          {/* Create form */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              {!isBulkMode && (
                <>
                  <Input
                    className="flex-1"
                    label={t("domain")}
                    placeholder={t("domainPlaceholder")}
                    size="sm"
                    value={domain}
                    onValueChange={setDomain}
                  />
                  <Input
                    className="flex-1"
                    label={t("name")}
                    placeholder={t("namePlaceholder")}
                    size="sm"
                    value={name}
                    onValueChange={setName}
                  />
                  <Input
                    className="flex-1"
                    label={t("value")}
                    placeholder={t("valuePlaceholder")}
                    size="sm"
                    type="password"
                    value={value}
                    onValueChange={setValue}
                  />
                </>
              )}
              <Select
                className={isBulkMode ? "w-36" : "w-36 shrink-0"}
                label={t("type")}
                selectedKeys={[type]}
                size="sm"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as FormType;

                  if (selected) setType(selected);
                }}
              >
                <SelectItem key="header">{t("typeHeader")}</SelectItem>
                <SelectItem key="cookie">{t("typeCookie")}</SelectItem>
                <SelectItem key="netscape">{t("typeNetscape")}</SelectItem>
                <SelectItem key="json">{t("typeJson")}</SelectItem>
              </Select>
            </div>
            {isBulkMode && (
              <Textarea
                minRows={4}
                placeholder={type === "netscape" ? t("bulkPlaceholderNetscape") : t("bulkPlaceholderJson")}
                value={bulkText}
                onValueChange={setBulkText}
              />
            )}
            <div className="flex justify-end">
              <Button
                color="primary"
                isDisabled={!isFormValid}
                isLoading={isCreating}
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={isBulkMode ? handleBulkCreate : handleCreate}
              >
                {isBulkMode ? t("importButton") : t("addButton")}
              </Button>
            </div>
          </div>

          {/* Token list */}
          {tokens.length > 0 && (
            <div className="mt-4">
              {selectedIds.size > 0 && (
                <div className="flex justify-end">
                  <Button
                    color="danger"
                    isLoading={bulkDeleteMutation.isPending}
                    size="sm"
                    startContent={<TrashIcon className="h-4 w-4" />}
                    onPress={handleBulkDelete}
                  >
                    {t("deleteSelected")} ({selectedIds.size})
                  </Button>
                </div>
              )}
              <Table aria-label={t("title")}>
                <TableHeader>
                  <TableColumn width={40}>
                    <Checkbox
                      aria-label={t("selectAll")}
                      isSelected={tokens.length > 0 && selectedIds.size === tokens.length}
                      isIndeterminate={selectedIds.size > 0 && selectedIds.size < tokens.length}
                      onValueChange={toggleSelectAll}
                    />
                  </TableColumn>
                  <TableColumn>{t("tableHeaders.domain")}</TableColumn>
                  <TableColumn>{t("tableHeaders.name")}</TableColumn>
                  <TableColumn>{t("tableHeaders.type")}</TableColumn>
                  <TableColumn>{t("tableHeaders.created")}</TableColumn>
                  <TableColumn>{t("tableHeaders.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <Checkbox
                          isSelected={selectedIds.has(token.id)}
                          onValueChange={() => toggleSelect(token.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <code className="bg-default-100 rounded px-2 py-1 text-xs">
                          {token.domain}
                        </code>
                      </TableCell>
                      <TableCell>{token.name}</TableCell>
                      <TableCell>
                        <Chip
                          color={token.type === "header" ? "primary" : "warning"}
                          size="sm"
                          variant="flat"
                        >
                          {token.type === "header" ? t("typeHeader") : t("typeCookie")}
                        </Chip>
                      </TableCell>
                      <TableCell>{new Date(token.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          title={t("deleteModal.confirmButton")}
                          variant="light"
                          onPress={() => {
                            setTokenToDelete(token.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tokens.length === 0 && (
            <p className="text-default-500 py-4 text-base">{t("noTokens")}</p>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        classNames={{ wrapper: "z-[1100]", backdrop: "z-[1099]" }}
        isOpen={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader>{t("deleteModal.title")}</ModalHeader>
              <ModalBody>
                <p>{t("deleteModal.message")}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {tActions("cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={removeMutation.isPending}
                  onPress={() => tokenToDelete && handleDelete(tokenToDelete)}
                >
                  {t("deleteModal.confirmButton")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
